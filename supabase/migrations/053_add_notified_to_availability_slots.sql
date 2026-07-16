-- Alter public.availability_slots to support delayed/debounced email alerts
alter table public.availability_slots
  add column if not exists notified boolean not null default false;

notify pgrst, 'reload schema';
