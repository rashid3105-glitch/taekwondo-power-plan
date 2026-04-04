CREATE POLICY "Admins can update clubs"
ON public.clubs
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));