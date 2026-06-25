-- Allow 'pending' status for student applications
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE public.students
  ADD CONSTRAINT students_status_check
  CHECK (status IN ('active', 'archived', 'pending'));

notify pgrst, 'reload schema';
