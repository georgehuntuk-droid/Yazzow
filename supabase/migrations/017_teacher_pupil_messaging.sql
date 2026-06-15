-- Create messages table for teacher-pupil communications
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutor_profiles (id) on delete cascade not null,
  parent_email text not null,
  sender text not null check (sender in ('tutor', 'parent')),
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Tutors full access to own messages
create policy "Tutors manage own messages"
  on public.messages for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- Indexes for fast queries
create index if not exists messages_tutor_id_idx on public.messages (tutor_id);
create index if not exists messages_parent_email_idx on public.messages (parent_email);
create index if not exists messages_created_at_idx on public.messages (created_at ASC);
