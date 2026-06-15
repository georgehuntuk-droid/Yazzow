-- Add announcement configuration to tutor_profiles
alter table public.tutor_profiles
add column if not exists portal_announcement text,
add column if not exists portal_announcement_active boolean not null default false;
