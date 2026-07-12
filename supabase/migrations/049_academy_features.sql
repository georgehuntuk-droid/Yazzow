-- 1. Alter public.bookings to add feedback_status column
alter table public.bookings
  add column if not exists feedback_status text default 'approved' check (feedback_status in ('pending_review', 'approved'));

-- 2. Backfill existing bookings to approved status
update public.bookings
set feedback_status = 'approved'
where feedback_status is null;

-- 3. Reload schema cache
notify pgrst, 'reload schema';
