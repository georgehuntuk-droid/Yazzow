-- Add lesson_reminder_sent_at column to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS lesson_reminder_sent_at TIMESTAMPTZ;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
