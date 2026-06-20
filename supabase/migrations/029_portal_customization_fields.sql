-- Alter tutor_profiles to add extended customization options
alter table public.tutor_profiles
  add column if not exists portal_bg_style text default 'grid',
  add column if not exists portal_side_banner_url text,
  add column if not exists portal_side_banner_link text,
  add column if not exists portal_side_widget_title text,
  add column if not exists portal_side_widget_content text;

notify pgrst, 'reload schema';
