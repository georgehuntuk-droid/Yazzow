-- Add payment reminder settings to tutor_profiles and tracking column to bookings
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS payment_reminder_amount_threshold_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_reminder_days_after INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
