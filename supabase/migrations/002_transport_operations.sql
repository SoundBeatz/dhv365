-- DHV365 Transport Operations Foundation

begin;

create type public.order_status as enum (
  'draft', 'submitted', 'under_review', 'quoted', 'accepted', 'rejected',
  'scheduled', 'collection_in_progress', 'in_transit', 'delivery_in_progress',
  'delivered', 'closed', 'cancelled', 'incident_hold'
);
create type public.service_type as enum ('critical_documents', 'time_critical', 'digital_data', 'high_value', 'special_handling');
create type public.party_role as enum ('requester', 'shipper', 'consignee', 'bill_to', 'emergency_contact');
create type public.custody_event_type as enum (
  'order_created', 'identity_verified', 'accepted', 'collected', 'condition_recorded',
  'sealed', 'departed', 'safe_stop', 'resumed', 'arrived', 'recipient_verified',
  'seal_verified', 'delivered', 'incident', 'cancelled', 'closed'
);
create type public.document_kind as enum (
  'order_attachment', 'identity_evidence', 'content_declaration', 'value_declaration',
  'insurance_confirmation', 'condition_photo', 'condition_video', 'signature',
  'proof_of_collection', 'proof_of_delivery', 'incident_evidence', 'other'
);
create type public.document_status as enum ('pending_scan', 'quarantined', 'available', 'rejected', 'deleted');
create type public.assignment_status as enum ('proposed', 'accepted', 'active', 'completed', 'cancelled');

create sequence public.dhv_order_reference_seq start 1000;

create or replace function public.next_order_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'DHV-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.dhv_order_reference_seq')::text, 7, '0');
$$;

create table public.transport_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_order_reference(),
  organization_id uuid not null references public.organizations(id),
  created_by uuid not null references auth.users(id),
  service_type public.service_type not null,
  status public.order_status not null default 'draft',
  title text not null,
  content_summary text,
  declared_value_minor bigint,
  declared_value_currency char(3) not null default 'EUR',
  weight_grams integer,
  length_mm integer,
  width_mm integer,
  height_mm integer,
  requested_collection_at timestamptz,
  accepted_at timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  requires_live_tracking boolean not null default false,
  requires_seal boolean not null default true,
  risk_class smallint not null default 1,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_title_length check (char_length(title) between 3 and 180),
  constraint order_value_valid check (declared_value_minor is null or declared_value_minor >= 0),
  constraint order_weight_valid check (weight_grams is null or weight_grams > 0),
  constraint order_currency_format check (declared_value_currency ~ '^[A-Z]{3}$'),
  constraint order_risk_class_valid check (risk_class between 1 and 5)
);

create index transport_orders_org_status_idx on public.transport_orders(organization_id, status, created_at desc);
create index transport_orders_created_by_idx on public.transport_orders(created_by, created_at desc);

create table public.order_parties (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  role public.party_role not null,
  company_name text,
  contact_name text not null,
  email text,
  phone_e164 text,
  address_line_1 text not null,
  address_line_2 text,
  postal_code text,
  city text not null,
  country_code char(2) not null,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_party_country_format check (country_code ~ '^[A-Z]{2}$')
);

create index order_parties_order_idx on public.order_parties(order_id, role);

create table public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  driver_user_id uuid not null references auth.users(id),
  vehicle_reference text,
  status public.assignment_status not null default 'proposed',
  starts_at timestamptz,
  ends_at timestamptz,
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, driver_user_id)
);

create table public.seals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  seal_number text not null,
  applied_by uuid references auth.users(id),
  applied_at timestamptz,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  condition_at_delivery text,
  created_at timestamptz not null default now(),
  unique (order_id, seal_number)
);

create table public.custody_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  event_type public.custody_event_type not null,
  actor_user_id uuid references auth.users(id),
  actor_role text,
  occurred_at timestamptz not null default now(),
  latitude numeric(9,6),
  longitude numeric(9,6),
  location_accuracy_m integer,
  details jsonb not null default '{}'::jsonb,
  previous_event_hash text,
  event_hash text not null,
  created_at timestamptz not null default now(),
  constraint custody_latitude_valid check (latitude is null or latitude between -90 and 90),
  constraint custody_longitude_valid check (longitude is null or longitude between -180 and 180)
);

create index custody_events_order_time_idx on public.custody_events(order_id, occurred_at, id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  kind public.document_kind not null,
  status public.document_status not null default 'pending_scan',
  storage_bucket text not null default 'secure-order-documents',
  storage_path text not null unique,
  original_filename text not null,
  media_type text not null,
  size_bytes bigint not null,
  sha256 text,
  uploaded_by uuid not null references auth.users(id),
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint document_size_valid check (size_bytes > 0 and size_bytes <= 52428800)
);

create index documents_order_idx on public.documents(order_id, kind, created_at desc);

create table public.tracking_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.transport_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  recorded_at timestamptz not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  accuracy_m integer,
  speed_kph numeric(6,2),
  source text not null default 'driver_app',
  created_at timestamptz not null default now(),
  constraint tracking_latitude_valid check (latitude between -90 and 90),
  constraint tracking_longitude_valid check (longitude between -180 and 180)
);

create index tracking_events_order_time_idx on public.tracking_events(order_id, recorded_at desc);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_org_time_idx on public.audit_events(organization_id, occurred_at desc);

create trigger transport_orders_set_updated_at before update on public.transport_orders for each row execute function public.set_updated_at();
create trigger order_parties_set_updated_at before update on public.order_parties for each row execute function public.set_updated_at();
create trigger driver_assignments_set_updated_at before update on public.driver_assignments for each row execute function public.set_updated_at();

create or replace function public.prevent_immutable_changes()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'DHV365 immutable records cannot be changed or deleted';
end;
$$;

create trigger custody_events_immutable before update or delete on public.custody_events
for each row execute function public.prevent_immutable_changes();
create trigger audit_events_immutable before update or delete on public.audit_events
for each row execute function public.prevent_immutable_changes();

alter table public.transport_orders enable row level security;
alter table public.order_parties enable row level security;
alter table public.driver_assignments enable row level security;
alter table public.seals enable row level security;
alter table public.custody_events enable row level security;
alter table public.documents enable row level security;
alter table public.tracking_events enable row level security;
alter table public.audit_events enable row level security;

create policy orders_select_member on public.transport_orders for select to authenticated
using (public.is_org_member(organization_id));
create policy orders_insert_member on public.transport_orders for insert to authenticated
with check (public.is_org_member(organization_id) and created_by = auth.uid() and status = 'draft');
create policy orders_update_operator on public.transport_orders for update to authenticated
using (created_by = auth.uid() or public.has_org_role(organization_id, array['owner','admin','dispatcher']::public.member_role[]))
with check (public.is_org_member(organization_id));

create policy parties_select_member on public.order_parties for select to authenticated using (public.is_org_member(organization_id));
create policy parties_manage_operator on public.order_parties for all to authenticated
using (public.has_org_role(organization_id, array['owner','admin','dispatcher','client']::public.member_role[]))
with check (public.has_org_role(organization_id, array['owner','admin','dispatcher','client']::public.member_role[]));

create policy assignments_select_member on public.driver_assignments for select to authenticated
using (public.is_org_member(organization_id));
create policy assignments_manage_dispatcher on public.driver_assignments for all to authenticated
using (public.has_org_role(organization_id, array['owner','admin','dispatcher']::public.member_role[]))
with check (public.has_org_role(organization_id, array['owner','admin','dispatcher']::public.member_role[]));

create policy seals_select_member on public.seals for select to authenticated using (public.is_org_member(organization_id));
create policy seals_insert_operator on public.seals for insert to authenticated
with check (public.has_org_role(organization_id, array['owner','admin','dispatcher','driver']::public.member_role[]));
create policy seals_update_operator on public.seals for update to authenticated
using (public.has_org_role(organization_id, array['owner','admin','dispatcher','driver']::public.member_role[]));

create policy custody_select_member on public.custody_events for select to authenticated using (public.is_org_member(organization_id));
create policy custody_insert_operator on public.custody_events for insert to authenticated
with check (public.has_org_role(organization_id, array['owner','admin','dispatcher','driver']::public.member_role[]) and actor_user_id = auth.uid());

create policy documents_select_member on public.documents for select to authenticated using (public.is_org_member(organization_id));
create policy documents_insert_member on public.documents for insert to authenticated
with check (public.is_org_member(organization_id) and uploaded_by = auth.uid());
create policy documents_update_operator on public.documents for update to authenticated
using (public.has_org_role(organization_id, array['owner','admin','dispatcher']::public.member_role[]));

create policy tracking_select_controlled on public.tracking_events for select to authenticated
using (public.has_org_role(organization_id, array['owner','admin','dispatcher','driver','auditor']::public.member_role[]));
create policy tracking_insert_driver on public.tracking_events for insert to authenticated
with check (public.has_org_role(organization_id, array['owner','admin','dispatcher','driver']::public.member_role[]));

create policy audit_select_authorized on public.audit_events for select to authenticated
using (public.has_org_role(organization_id, array['owner','admin','auditor']::public.member_role[]));

commit;
