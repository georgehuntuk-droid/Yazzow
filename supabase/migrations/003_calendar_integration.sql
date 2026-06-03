-- Yazzow calendar integration (iCal feed + Google Calendar)
-- Apply after 002_extended_schema.sql

alter table public.tutor_profiles
  add column if not exists calendar_feed_token uuid default gen_random_uuid();

alter table public.tutor_profiles
  add column if not exists google_refresh_token text;

alter table public.tutor_profiles
  add column if not exists google_calendar_id text default 'primary';

create unique index if not exists tutor_profiles_calendar_feed_token_idx
  on public.tutor_profiles (calendar_feed_token);

update public.tutor_profiles
set calendar_feed_token = gen_random_uuid()
where calendar_feed_token is null;

alter table public.bookings
  add column if not exists google_calendar_event_id text;

notify pgrst, 'reload schema';
