-- Add country and bank details configuration to tutor_profiles
alter table public.tutor_profiles 
add column if not exists country text,
add column if not exists bank_name text,
add column if not exists bank_sort_code text,
add column if not exists bank_account_number text;
