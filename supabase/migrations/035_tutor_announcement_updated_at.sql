-- Add portal_announcement_updated_at to tutor_profiles
ALTER TABLE public.tutor_profiles
ADD COLUMN IF NOT EXISTS portal_announcement_updated_at timestamptz;
