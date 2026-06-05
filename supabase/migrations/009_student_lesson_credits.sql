-- Tutor student management extension: lesson credits support
-- This allows storing prepaid credits directly on a student profile and tracks bulk lesson packages sold.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS lesson_credits INTEGER NOT NULL DEFAULT 0;

-- Optional constraint to prevent negative credit counts
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_lesson_credits_check;

ALTER TABLE public.students
  ADD CONSTRAINT students_lesson_credits_check
  CHECK (lesson_credits >= 0);

-- Notify PostgREST schema cache to pick up our new database changes
NOTIFY pgrst, 'reload schema';
