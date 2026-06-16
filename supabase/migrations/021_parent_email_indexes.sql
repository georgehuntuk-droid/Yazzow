-- Add indexes to parent_email fields in bookings and students tables to speed up dashboard lookup queries
CREATE INDEX IF NOT EXISTS bookings_parent_email_idx ON public.bookings (parent_email);
CREATE INDEX IF NOT EXISTS students_parent_email_idx ON public.students (parent_email);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
