-- Secure support tickets table by dropping the overly permissive RLS policy.
-- Since all operations on support_tickets are performed server-side via the Supabase Service Role key (Admin Client),
-- we do not need any client-accessible policies. Enabling RLS without any active policies will deny all public (anon/authenticated) client access by default.

drop policy if exists "Admins full access to support tickets" on public.support_tickets;
