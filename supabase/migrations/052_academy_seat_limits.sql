-- Alter public.tutor_profiles to support additional purchased seats
alter table public.tutor_profiles
  add column if not exists additional_purchased_seats integer not null default 0;

notify pgrst, 'reload schema';
