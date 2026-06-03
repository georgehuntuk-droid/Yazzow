-- Hourly booking slots, cancellations, parent slot alerts, realtime

-- ---------------------------------------------------------------------------
-- Slot alert subscribers (parents / families watching for openings)
-- ---------------------------------------------------------------------------

create table if not exists public.slot_alert_subscribers (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  parent_email text not null,
  student_name text,
  created_at timestamptz not null default now(),
  unique (tutor_id, parent_email)
);

create index if not exists slot_alert_subscribers_tutor_idx
  on public.slot_alert_subscribers (tutor_id);

alter table public.slot_alert_subscribers enable row level security;

drop policy if exists "Tutors read slot alert subscribers" on public.slot_alert_subscribers;
create policy "Tutors read slot alert subscribers"
  on public.slot_alert_subscribers for select
  using (auth.uid() = tutor_id);

-- Inserts via service role / server actions only (no public direct insert)

-- ---------------------------------------------------------------------------
-- Booking cancellation metadata
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text;

drop policy if exists "Tutors update own bookings" on public.bookings;
create policy "Tutors update own bookings"
  on public.bookings for update
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- ---------------------------------------------------------------------------
-- Realtime: parents see slots reopen when a booking is cancelled
-- ---------------------------------------------------------------------------

alter table public.availability_slots replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'availability_slots'
  ) then
    alter publication supabase_realtime add table public.availability_slots;
  end if;
end $$;

notify pgrst, 'reload schema';
