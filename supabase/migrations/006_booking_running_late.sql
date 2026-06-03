-- Tutor "running late" notification on confirmed bookings

alter table public.bookings
  add column if not exists running_late_sent_at timestamptz,
  add column if not exists running_late_note text;

notify pgrst, 'reload schema';
