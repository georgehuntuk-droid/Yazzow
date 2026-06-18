-- Ensure cover_url column exists on tutor_profiles
alter table public.tutor_profiles add column if not exists cover_url text;

-- ---------------------------------------------------------------------------
-- Worksheets (private) — tutors upload to their own folder: {user_id}/...
-- ---------------------------------------------------------------------------

drop policy if exists "Tutors upload own worksheets" on storage.objects;
drop policy if exists "Tutors read own worksheets" on storage.objects;
drop policy if exists "Tutors update own worksheets" on storage.objects;
drop policy if exists "Tutors delete own worksheets" on storage.objects;
drop policy if exists "worksheets_tutor_all" on storage.objects;

create policy "worksheets_tutor_all"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'worksheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'worksheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Avatars (public read, tutor write to own folder)
-- ---------------------------------------------------------------------------

drop policy if exists "Tutors upload own avatars" on storage.objects;
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Tutors update own avatars" on storage.objects;
drop policy if exists "Tutors delete own avatars" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_tutor_all" on storage.objects;

create policy "avatars_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_tutor_all"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- digital_resources — ensure tutors can insert their own rows
-- ---------------------------------------------------------------------------

drop policy if exists "Tutors insert own resources" on public.digital_resources;
create policy "Tutors insert own resources"
  on public.digital_resources
  for insert
  to authenticated
  with check (auth.uid() = tutor_id);

drop policy if exists "Tutors update own resources" on public.digital_resources;
create policy "Tutors update own resources"
  on public.digital_resources
  for update
  to authenticated
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

drop policy if exists "Tutors delete own resources" on public.digital_resources;
create policy "Tutors delete own resources"
  on public.digital_resources
  for delete
  to authenticated
  using (auth.uid() = tutor_id);

notify pgrst, 'reload schema';
