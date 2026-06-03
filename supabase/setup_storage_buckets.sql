-- Run this in Supabase → SQL Editor if uploads fail with "Bucket not found".
-- Safe to re-run (idempotent).

-- ---------------------------------------------------------------------------
-- Profile & cover photos (public)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tutors upload own avatars" on storage.objects;
create policy "Tutors upload own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Tutors update own avatars" on storage.objects;
create policy "Tutors update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors delete own avatars" on storage.objects;
create policy "Tutors delete own avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Worksheet packs (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'worksheets',
  'worksheets',
  false,
  52428800,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tutors upload own worksheets" on storage.objects;
create policy "Tutors upload own worksheets"
  on storage.objects for insert
  with check (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors read own worksheets" on storage.objects;
create policy "Tutors read own worksheets"
  on storage.objects for select
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors update own worksheets" on storage.objects;
create policy "Tutors update own worksheets"
  on storage.objects for update
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors delete own worksheets" on storage.objects;
create policy "Tutors delete own worksheets"
  on storage.objects for delete
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Cover photo column (portal customization)
alter table public.tutor_profiles
  add column if not exists cover_url text;

notify pgrst, 'reload schema';
