-- Add is_paid column to bookings to track offline/cash payment settlement status
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT true;

-- Update existing direct/cash bookings to default to unpaid/owed
UPDATE public.bookings
  SET is_paid = false
  WHERE stripe_payment_intent_id = 'cash';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
