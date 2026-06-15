-- Add cash payment configuration to tutor_profiles
alter table public.tutor_profiles 
add column if not exists allow_cash_payments boolean not null default true,
add column if not exists payment_instructions text;
