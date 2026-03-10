
-- Allow admin to insert coach_athletes (for reassignment)
CREATE POLICY "Admin can add coach athletes"
ON public.coach_athletes
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Allow admin to delete coach_athletes (for reassignment)
CREATE POLICY "Admin can remove coach athletes"
ON public.coach_athletes
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admin to view coach_athletes
CREATE POLICY "Admin can view coach athletes"
ON public.coach_athletes
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
