-- Migration 040: Add send_meeting_links to tutor_profiles to allow turning on/off meeting links in emails
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS send_meeting_links boolean NOT NULL DEFAULT true;
