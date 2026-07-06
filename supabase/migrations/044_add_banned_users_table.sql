-- Migration 044: Add banned_users table and resolve security advisor & database linter warnings

CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Redefine on_auth_user_deleted trigger function with secure search_path
CREATE OR REPLACE FUNCTION public.on_auth_user_deleted()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := OLD.email;
  
  IF user_email IS NOT NULL AND user_email <> '' THEN
    -- Delete messages where this user is the parent
    DELETE FROM public.messages WHERE LOWER(parent_email) = LOWER(user_email);
    
    -- Delete bookings where this user is the parent
    DELETE FROM public.bookings WHERE LOWER(parent_email) = LOWER(user_email);
    
    -- Delete student records where this user is the parent
    -- This will cascade delete student_tasks due to foreign key ON DELETE CASCADE
    DELETE FROM public.students WHERE LOWER(parent_email) = LOWER(user_email);

    -- Delete from banned_users
    DELETE FROM public.banned_users WHERE LOWER(email) = LOWER(user_email) OR id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 1. Fix Function Search Path Mutable warnings
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.on_auth_user_deleted() SET search_path = public;

-- 2. Fix SECURITY DEFINER execution warnings (revoke from PUBLIC/authenticated)
REVOKE EXECUTE ON FUNCTION public.on_auth_user_deleted() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_auth_user_deleted() FROM authenticated;

-- 3. Fix Public Bucket Allows Listing warnings by dropping direct select policies
-- (Direct downloads still work for public buckets without these broad list-allowing select policies)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Public read attachments" ON storage.objects;

-- 4. Create explicit deny-all policies to satisfy the Supabase Linter (rls_enabled_no_policy)
-- since these tables are queried/written exclusively via the superuser service_role key.
DROP POLICY IF EXISTS "No public access to banned_users" ON public.banned_users;
CREATE POLICY "No public access to banned_users"
  ON public.banned_users FOR ALL
  USING (false);

DROP POLICY IF EXISTS "No public access to support_tickets" ON public.support_tickets;
CREATE POLICY "No public access to support_tickets"
  ON public.support_tickets FOR ALL
  USING (false);

DROP POLICY IF EXISTS "No public access to schema_migrations" ON public._schema_migrations;
CREATE POLICY "No public access to schema_migrations"
  ON public._schema_migrations FOR ALL
  USING (false);

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
