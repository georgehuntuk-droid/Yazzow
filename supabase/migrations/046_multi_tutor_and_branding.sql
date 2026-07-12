-- Alter tutor_profiles to support parent academy references
alter table public.tutor_profiles
  add column if not exists parent_academy_id uuid references public.tutor_profiles(id) on delete set null;

-- Create index on parent_academy_id for efficient team listing
create index if not exists tutor_profiles_parent_academy_idx 
  on public.tutor_profiles(parent_academy_id);

-- Create academy_invitations table
create table if not exists public.academy_invitations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.tutor_profiles(id) on delete cascade,
  email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint academy_invitations_unique unique (academy_id, email)
);

-- Enable RLS on academy_invitations
alter table public.academy_invitations enable row level security;

-- Create policies for academy_invitations
drop policy if exists "Tutors manage own invitations" on public.academy_invitations;
create policy "Tutors manage own invitations"
  on public.academy_invitations for all
  using (academy_id = auth.uid())
  with check (academy_id = auth.uid());

drop policy if exists "Public read invitations" on public.academy_invitations;
create policy "Public read invitations"
  on public.academy_invitations for select
  using (true);

notify pgrst, 'reload schema';
