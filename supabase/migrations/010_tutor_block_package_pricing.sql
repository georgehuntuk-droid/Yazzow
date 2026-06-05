-- Tutor package block pricing support
-- This migration allows tutors to decide on an offering of prepaid lesson packages with slider ranges or customizable items.

ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS block_package_lessons_count INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS block_package_discount_percent INTEGER NOT NULL DEFAULT 10; -- e.g. 10% discount for buying 10 sessions

-- Notify PostgREST schema cache
NOTIFY pgrst, 'reload schema';
