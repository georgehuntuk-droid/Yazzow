-- 1. Alter public.tutor_profiles to support Academy owner and staff roles
alter table public.tutor_profiles
  add column if not exists role text default 'independent' check (role in ('independent', 'academy_owner', 'staff_tutor')),
  add column if not exists academy_id uuid references public.tutor_profiles(id) on delete set null,
  add column if not exists business_logo_url text,
  add column if not exists primary_brand_color text,
  add column if not exists business_name text;

-- 2. Create indexes for role and academy query optimizations
create index if not exists tutor_profiles_role_idx on public.tutor_profiles(role);
create index if not exists tutor_profiles_academy_id_idx on public.tutor_profiles(academy_id);

-- 3. Backfill roles and align references based on existing data
update public.tutor_profiles
set 
  role = 'staff_tutor',
  academy_id = parent_academy_id
where parent_academy_id is not null;

update public.tutor_profiles
set role = 'academy_owner'
where subscription_tier = 'academy' and parent_academy_id is null;

update public.tutor_profiles
set role = 'independent'
where role is null;

-- 4. Reload schema cache
notify pgrst, 'reload schema';
