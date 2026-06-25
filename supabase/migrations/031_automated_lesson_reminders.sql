-- Add automated_lesson_reminders column to tutor_profiles
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS automated_lesson_reminders BOOLEAN DEFAULT false;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
