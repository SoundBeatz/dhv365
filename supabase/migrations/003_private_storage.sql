-- Private document storage. Objects remain inaccessible without both
-- organization membership and a matching document record.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'secure-order-documents',
  'secure-order-documents',
  false,
  52428800,
  array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy secure_documents_select on storage.objects for select to authenticated
using (
  bucket_id = 'secure-order-documents'
  and exists (
    select 1 from public.documents d
    where d.storage_bucket = bucket_id
      and d.storage_path = name
      and d.status = 'available'
      and public.is_org_member(d.organization_id)
  )
);

create policy secure_documents_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'secure-order-documents'
  and (storage.foldername(name))[1] in (
    select m.organization_id::text
    from public.organization_members m
    where m.user_id = auth.uid() and m.status = 'active'
  )
);

create policy secure_documents_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'secure-order-documents'
  and exists (
    select 1 from public.documents d
    where d.storage_bucket = bucket_id
      and d.storage_path = name
      and public.has_org_role(d.organization_id, array['owner','admin']::public.member_role[])
  )
);

commit;
