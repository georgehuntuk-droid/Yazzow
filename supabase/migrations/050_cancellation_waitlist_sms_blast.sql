-- Alter tutor_profiles to add last_sms_blast_at tracker
alter table public.tutor_profiles
  add column if not exists last_sms_blast_at timestamptz;

-- Alter bookings to add subject_id and education_level for targeted cohort matching
alter table public.bookings
  add column if not exists subject_id text,
  add column if not exists education_level text;

-- Alter students to add subject_id and education_level for matching waitlist cohorts
alter table public.students
  add column if not exists subject_id text,
  add column if not exists education_level text;

-- Alter availability_slots to add claim_token for transactional atomic slot claiming
alter table public.availability_slots
  add column if not exists claim_token text unique;

notify pgrst, 'reload schema';
