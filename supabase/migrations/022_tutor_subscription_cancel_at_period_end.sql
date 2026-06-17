-- Track if a tutor subscription is set to cancel at the end of the billing period
alter table public.tutor_profiles
  add column if not exists subscription_cancel_at_period_end boolean default false;
