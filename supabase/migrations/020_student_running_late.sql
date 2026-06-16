-- Add student running late notification columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS student_running_late_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_running_late_note text;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
