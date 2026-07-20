-- DHV365 transactional email queue foundation
-- Migration: 20260720103000_create_email_jobs

create extension if not exists pgcrypto;

create type public.email_job_status as enum (
  'pending',
  'processing',
  'sent',
  'failed',
  'cancelled'
);

create table public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  template_key text not null check (template_key ~ '^[a-z0-9][a-z0-9._-]{1,99}$'),
  recipient_email text not null check (
    recipient_email = lower(recipient_email)
    and recipient_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  recipient_name text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status public.email_job_status not null default 'pending',
  priority smallint not null default 100 check (priority between 1 and 1000),
  scheduled_at timestamptz not null default now(),
  attempts smallint not null default 0 check (attempts >= 0),
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  locked_at timestamptz,
  locked_by text,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_jobs_sent_state check (
    (status = 'sent' and sent_at is not null and provider_message_id is not null)
    or status <> 'sent'
  )
);

comment on table public.email_jobs is 'Server-managed queue for DHV365 transactional email delivery.';
comment on column public.email_jobs.payload is 'Template variables only; never store passwords, access tokens, or private keys.';

create index email_jobs_dispatch_idx
  on public.email_jobs (priority asc, scheduled_at asc, created_at asc)
  where status in ('pending', 'failed');

create index email_jobs_provider_message_id_idx
  on public.email_jobs (provider_message_id)
  where provider_message_id is not null;

create index email_jobs_created_by_idx
  on public.email_jobs (created_by, created_at desc)
  where created_by is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_email_jobs_updated_at
before update on public.email_jobs
for each row execute function public.set_updated_at();

alter table public.email_jobs enable row level security;

-- No client-facing policies are created intentionally.
-- The queue is only accessible through trusted server code using the service role.
revoke all on table public.email_jobs from anon, authenticated;
grant select, insert, update on table public.email_jobs to service_role;

create or replace function public.claim_email_jobs(
  worker_id text,
  batch_size integer default 10
)
returns setof public.email_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if worker_id is null or length(trim(worker_id)) < 3 then
    raise exception 'worker_id must contain at least 3 characters';
  end if;

  if batch_size < 1 or batch_size > 100 then
    raise exception 'batch_size must be between 1 and 100';
  end if;

  return query
  with candidates as (
    select id
    from public.email_jobs
    where status in ('pending', 'failed')
      and scheduled_at <= now()
      and attempts < max_attempts
      and (locked_at is null or locked_at < now() - interval '15 minutes')
    order by priority asc, scheduled_at asc, created_at asc
    for update skip locked
    limit batch_size
  )
  update public.email_jobs jobs
  set status = 'processing',
      locked_at = now(),
      locked_by = trim(worker_id),
      attempts = jobs.attempts + 1,
      last_error = null
  from candidates
  where jobs.id = candidates.id
  returning jobs.*;
end;
$$;

create or replace function public.complete_email_job(
  job_id uuid,
  worker_id text,
  provider_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if provider_id is null or length(trim(provider_id)) < 3 then
    raise exception 'provider_id must contain at least 3 characters';
  end if;

  update public.email_jobs
  set status = 'sent',
      sent_at = now(),
      provider_message_id = trim(provider_id),
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = job_id
    and status = 'processing'
    and locked_by = trim(worker_id);

  if not found then
    raise exception 'Email job not found or not owned by this worker';
  end if;
end;
$$;

create or replace function public.fail_email_job(
  job_id uuid,
  worker_id text,
  error_message text,
  retry_delay_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if retry_delay_seconds < 0 or retry_delay_seconds > 86400 then
    raise exception 'retry_delay_seconds must be between 0 and 86400';
  end if;

  update public.email_jobs
  set status = case
        when attempts >= max_attempts then 'failed'::public.email_job_status
        else 'pending'::public.email_job_status
      end,
      scheduled_at = case
        when attempts >= max_attempts then scheduled_at
        else now() + make_interval(secs => retry_delay_seconds)
      end,
      locked_at = null,
      locked_by = null,
      last_error = left(coalesce(error_message, 'Unknown delivery error'), 4000)
  where id = job_id
    and status = 'processing'
    and locked_by = trim(worker_id);

  if not found then
    raise exception 'Email job not found or not owned by this worker';
  end if;
end;
$$;

revoke all on function public.claim_email_jobs(text, integer) from public, anon, authenticated;
revoke all on function public.complete_email_job(uuid, text, text) from public, anon, authenticated;
revoke all on function public.fail_email_job(uuid, text, text, integer) from public, anon, authenticated;

grant execute on function public.claim_email_jobs(text, integer) to service_role;
grant execute on function public.complete_email_job(uuid, text, text) to service_role;
grant execute on function public.fail_email_job(uuid, text, text, integer) to service_role;
