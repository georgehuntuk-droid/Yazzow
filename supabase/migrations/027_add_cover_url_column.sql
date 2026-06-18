-- Add missing cover_url column to tutor_profiles
alter table public.tutor_profiles add column if not exists cover_url text;
notify pgrst, 'reload schema';
