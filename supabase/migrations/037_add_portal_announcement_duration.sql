-- Migration 037: Add portal_announcement_duration_hours and portal_announcement_updated_at if missing
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS portal_announcement_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_announcement_duration_hours INTEGER;
