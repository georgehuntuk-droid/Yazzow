-- In-house support tickets schema

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutor_profiles (id) on delete set null,
  name text not null,
  email text not null,
  category text not null,
  message text not null,
  source text not null default 'support page',
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.support_tickets enable row level security;

-- Admin can do anything
create policy "Admins full access to support tickets"
  on public.support_tickets
  using (true)
  with check (true);

-- Indexes for performance
create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at DESC);
create index if not exists support_tickets_tutor_idx on public.support_tickets (tutor_id);
