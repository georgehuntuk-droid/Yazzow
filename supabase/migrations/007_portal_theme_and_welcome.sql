-- Extra portal customization for tutor public pages

alter table public.tutor_profiles
  add column if not exists portal_welcome_message text,
  add column if not exists portal_accent_oklch text;

notify pgrst, 'reload schema';
