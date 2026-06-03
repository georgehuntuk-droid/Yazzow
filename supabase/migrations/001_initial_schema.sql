-- Yazzow initial schema
-- Idempotent where possible; safe to re-run after partial failures.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.tutor_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  headline text,
  bio text,
  avatar_url text,
  lesson_price_cents integer not null default 4500,
  currency text not null default 'gbp',
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint slot_range check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots (id),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  parent_email text not null,
  student_name text,
  amount_cents integer not null,
  platform_fee_cents integer not null,
  stripe_payment_intent_id text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.digital_resources (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'gbp',
  file_path text not null,
  thumbnail_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_purchases (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.digital_resources (id),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  buyer_email text not null,
  amount_cents integer not null,
  platform_fee_cents integer not null,
  download_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  student_name text not null,
  parent_email text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (tutor_id, parent_email, student_name)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists tutor_profiles_username_idx on public.tutor_profiles (username);
create index if not exists availability_slots_tutor_starts_idx
  on public.availability_slots (tutor_id, starts_at);
create index if not exists digital_resources_tutor_idx on public.digital_resources (tutor_id);
create index if not exists students_tutor_idx on public.students (tutor_id);
create index if not exists bookings_tutor_idx on public.bookings (tutor_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tutor_profiles_updated_at on public.tutor_profiles;
create trigger tutor_profiles_updated_at
  before update on public.tutor_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.tutor_profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.digital_resources enable row level security;
alter table public.resource_purchases enable row level security;
alter table public.students enable row level security;

-- tutor_profiles
drop policy if exists "Public read tutor profiles" on public.tutor_profiles;
create policy "Public read tutor profiles"
  on public.tutor_profiles for select
  using (true);

drop policy if exists "Tutors insert own profile" on public.tutor_profiles;
create policy "Tutors insert own profile"
  on public.tutor_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Tutors update own profile" on public.tutor_profiles;
create policy "Tutors update own profile"
  on public.tutor_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Tutors delete own profile" on public.tutor_profiles;
create policy "Tutors delete own profile"
  on public.tutor_profiles for delete
  using (auth.uid() = id);

-- availability_slots
drop policy if exists "Public read open slots" on public.availability_slots;
create policy "Public read open slots"
  on public.availability_slots for select
  using (is_booked = false);

drop policy if exists "Tutors read own slots" on public.availability_slots;
create policy "Tutors read own slots"
  on public.availability_slots for select
  using (auth.uid() = tutor_id);

drop policy if exists "Tutors manage own slots" on public.availability_slots;
create policy "Tutors manage own slots"
  on public.availability_slots for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- digital_resources
drop policy if exists "Public read published resources" on public.digital_resources;
create policy "Public read published resources"
  on public.digital_resources for select
  using (is_published = true);

drop policy if exists "Tutors read own resources" on public.digital_resources;
create policy "Tutors read own resources"
  on public.digital_resources for select
  using (auth.uid() = tutor_id);

drop policy if exists "Tutors manage own resources" on public.digital_resources;
create policy "Tutors manage own resources"
  on public.digital_resources for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- bookings (tutor reads own; inserts via service role / webhooks later)
drop policy if exists "Tutors read own bookings" on public.bookings;
create policy "Tutors read own bookings"
  on public.bookings for select
  using (auth.uid() = tutor_id);

-- students
drop policy if exists "Tutors manage own students" on public.students;
create policy "Tutors manage own students"
  on public.students for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- resource_purchases
drop policy if exists "Tutors read own purchases" on public.resource_purchases;
create policy "Tutors read own purchases"
  on public.resource_purchases for select
  using (auth.uid() = tutor_id);

-- ---------------------------------------------------------------------------
-- Storage: private worksheet bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'worksheets',
  'worksheets',
  false,
  52428800,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

drop policy if exists "Tutors upload own worksheets" on storage.objects;
create policy "Tutors upload own worksheets"
  on storage.objects for insert
  with check (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors read own worksheets" on storage.objects;
create policy "Tutors read own worksheets"
  on storage.objects for select
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors update own worksheets" on storage.objects;
create policy "Tutors update own worksheets"
  on storage.objects for update
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Tutors delete own worksheets" on storage.objects;
create policy "Tutors delete own worksheets"
  on storage.objects for delete
  using (
    bucket_id = 'worksheets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
