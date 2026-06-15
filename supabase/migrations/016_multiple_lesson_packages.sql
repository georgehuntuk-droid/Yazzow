-- Create tutor_packages table to support multiple custom lesson bundles
create table if not exists public.tutor_packages (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  name text not null,
  lessons_count integer not null,
  price_cents integer not null,
  currency text not null default 'gbp',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.tutor_packages enable row level security;

-- Policies
drop policy if exists "Public read active tutor packages" on public.tutor_packages;
create policy "Public read active tutor packages"
  on public.tutor_packages for select
  using (is_active = true);

drop policy if exists "Tutors manage own packages" on public.tutor_packages;
create policy "Tutors manage own packages"
  on public.tutor_packages for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);
