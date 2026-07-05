-- Migration 038: Add meeting_link to tutor_profiles and lesson_type to students
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT 'online';

-- Safe check constraint addition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_lesson_type_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_lesson_type_check CHECK (lesson_type IN ('online', 'visiting'));
  END IF;
END
$$;

notify pgrst, 'reload schema';
