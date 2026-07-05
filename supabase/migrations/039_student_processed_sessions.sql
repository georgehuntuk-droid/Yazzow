-- Migration 039: Add processed_sessions to students table to track Stripe checkout session fulfillment
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS processed_sessions text[] NOT NULL DEFAULT '{}';
