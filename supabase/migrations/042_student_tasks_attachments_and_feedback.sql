-- Add attachment and student feedback columns to student_tasks table
ALTER TABLE public.student_tasks 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS student_feedback TEXT;
