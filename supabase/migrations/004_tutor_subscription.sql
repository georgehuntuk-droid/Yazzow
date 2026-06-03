-- Tutor platform subscription (e.g. £25/month via Stripe Billing)

alter table public.tutor_profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_current_period_end timestamptz;

create index if not exists tutor_profiles_subscription_status_idx
  on public.tutor_profiles (subscription_status)
  where subscription_status is not null;
