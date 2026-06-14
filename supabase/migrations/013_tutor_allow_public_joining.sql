-- Add allow_public_joining column to tutor_profiles
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS allow_public_joining BOOLEAN NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
