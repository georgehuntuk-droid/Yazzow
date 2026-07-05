-- Add attendance_status column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'attended' 
CHECK (attendance_status IN ('attended', 'late', 'absent'));
