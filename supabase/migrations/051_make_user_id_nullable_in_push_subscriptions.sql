-- Migration 051: Make user_id nullable in push_subscriptions for guest updates on front page
ALTER TABLE public.push_subscriptions ALTER COLUMN user_id DROP NOT NULL;
