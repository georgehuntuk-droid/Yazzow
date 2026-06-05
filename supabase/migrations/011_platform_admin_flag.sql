-- Platform admin flag on tutor profiles (persists admin access without env vars)

ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Restore owner admin access
UPDATE public.tutor_profiles
SET is_platform_admin = true
WHERE username = 'george-huntuk';

NOTIFY pgrst, 'reload schema';
