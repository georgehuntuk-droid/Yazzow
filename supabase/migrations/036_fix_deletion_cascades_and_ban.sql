-- Migration 036: Fix deletion cascades for bookings/purchases and add is_banned to tutor_profiles

-- 1. Fix bookings -> availability_slots constraint to cascade on delete
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey,
  ADD CONSTRAINT bookings_slot_id_fkey
    FOREIGN KEY (slot_id)
    REFERENCES public.availability_slots(id)
    ON DELETE CASCADE;

-- 2. Fix resource_purchases -> digital_resources constraint to cascade on delete
ALTER TABLE public.resource_purchases
  DROP CONSTRAINT IF EXISTS resource_purchases_resource_id_fkey,
  ADD CONSTRAINT resource_purchases_resource_id_fkey
    FOREIGN KEY (resource_id)
    REFERENCES public.digital_resources(id)
    ON DELETE CASCADE;

-- 3. Add is_banned column to tutor_profiles
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Create trigger to clean up parent/student records when a user is deleted from auth.users
CREATE OR REPLACE FUNCTION public.on_auth_user_deleted()
RETURNS TRIGGER
SECURITY DEFINER
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
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_deleted();
