-- Create student_tasks table
CREATE TABLE IF NOT EXISTS public.student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.tutor_profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  tutor_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS student_tasks_student_idx ON public.student_tasks (student_id);
CREATE INDEX IF NOT EXISTS student_tasks_tutor_idx ON public.student_tasks (tutor_id);

-- Policies
-- 1. Tutors can do all operations on tasks associated with their tutor profile
CREATE POLICY "Tutors manage own student tasks"
  ON public.student_tasks FOR ALL
  USING (tutor_id = auth.uid());

-- 2. Students can view tasks assigned to them (matching parent_email)
CREATE POLICY "Students view own tasks"
  ON public.student_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.parent_email = auth.email()
    )
  );

-- 3. Students can update task status (mark completed) for tasks assigned to them
CREATE POLICY "Students update own tasks status"
  ON public.student_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.parent_email = auth.email()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.parent_email = auth.email()
    )
  );
