-- Add subscription_tier column to tutor_profiles table, defaulting to 'starter'
ALTER TABLE public.tutor_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'starter';
