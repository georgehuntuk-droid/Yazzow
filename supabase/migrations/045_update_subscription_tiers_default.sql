-- Alter tutor_profiles table to set default subscription tier to 'independent'
ALTER TABLE public.tutor_profiles ALTER COLUMN subscription_tier SET DEFAULT 'independent';

-- Map existing legacy tiers to the new tiers
-- 'starter' and 'growth' maps to 'independent'
-- 'agency' maps to 'academy'
UPDATE public.tutor_profiles SET subscription_tier = 'independent' WHERE subscription_tier = 'starter';
UPDATE public.tutor_profiles SET subscription_tier = 'independent' WHERE subscription_tier = 'growth';
UPDATE public.tutor_profiles SET subscription_tier = 'academy' WHERE subscription_tier = 'agency';
