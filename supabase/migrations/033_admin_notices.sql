-- Migration to add admin_notices table for platform notices / announcements

create table if not exists public.admin_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.admin_notices enable row level security;

-- Authenticated select policy
drop policy if exists "Authenticated read admin notices" on public.admin_notices;
create policy "Authenticated read admin notices"
  on public.admin_notices for select
  to authenticated
  using (true);

-- Notify schema reload
notify pgrst, 'reload schema';
