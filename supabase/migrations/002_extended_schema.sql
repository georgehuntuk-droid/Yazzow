-- Yazzow extended schema
-- Idempotent — safe to re-run. Apply after 001_initial_schema.sql.

-- ---------------------------------------------------------------------------
-- Migration tracking
-- ---------------------------------------------------------------------------

create table if not exists public._schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Integrity & performance
-- ---------------------------------------------------------------------------

-- One confirmed booking per slot (prevents double-book race conditions)
create unique index if not exists bookings_one_confirmed_per_slot
  on public.bookings (slot_id)
  where status = 'confirmed';

create index if not exists bookings_stripe_payment_intent_idx
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists resource_purchases_token_idx
  on public.resource_purchases (download_token);

create index if not exists resource_purchases_stripe_payment_intent_idx
  on public.resource_purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists bookings_parent_email_idx
  on public.bookings (tutor_id, parent_email);

-- ---------------------------------------------------------------------------
-- Weekly schedule rules (recurring availability — schedule builder)
-- ---------------------------------------------------------------------------

create table if not exists public.schedule_rules (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint schedule_time_range check (end_time > start_time),
  unique (tutor_id, day_of_week, start_time, end_time)
);

create index if not exists schedule_rules_tutor_active_idx
  on public.schedule_rules (tutor_id, is_active);

alter table public.schedule_rules enable row level security;

drop policy if exists "Tutors manage own schedule rules" on public.schedule_rules;
create policy "Tutors manage own schedule rules"
  on public.schedule_rules for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- ---------------------------------------------------------------------------
-- Tutors can read their own purchases (ledger / revenue)
-- ---------------------------------------------------------------------------

drop policy if exists "Tutors read own resource purchases" on public.resource_purchases;
create policy "Tutors read own resource purchases"
  on public.resource_purchases for select
  using (auth.uid() = tutor_id);

-- ---------------------------------------------------------------------------
-- Reload PostgREST schema cache (fixes "table not in schema cache" after DDL)
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
