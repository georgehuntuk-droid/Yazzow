-- Alter bookings and students to add parent_phone
alter table public.bookings
  add column if not exists parent_phone text;

alter table public.students
  add column if not exists parent_phone text;

-- Add sms_sent_count tracking column to tutor_profiles
alter table public.tutor_profiles
  add column if not exists sms_sent_count integer not null default 0;

-- Create atomic increment function for SMS messages
create or replace function public.increment_sms_count(tutor_profile_id uuid)
returns void as $$
begin
  update public.tutor_profiles
  set sms_sent_count = sms_sent_count + 1
  where id = tutor_profile_id;
end;
$$ language plpgsql security definer;

notify pgrst, 'reload schema';
