
-- Drop the overly permissive ALL policy and replace with specific policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admin SELECT all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admin UPDATE with proper WITH CHECK
CREATE POLICY "Admins can update all roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Admin DELETE
CREATE POLICY "Admins can delete all roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
