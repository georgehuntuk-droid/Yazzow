-- Add credit_limit column to public.students table and update credit check constraints
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS credit_limit INTEGER NOT NULL DEFAULT 0;

-- Drop standard positive check constraint and replace with credit limit-aware check
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_lesson_credits_check;

ALTER TABLE public.students
  ADD CONSTRAINT students_lesson_credits_check
  CHECK (lesson_credits >= -credit_limit);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
