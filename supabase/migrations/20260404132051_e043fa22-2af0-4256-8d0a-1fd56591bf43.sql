CREATE POLICY "Admins can insert clubs"
ON public.clubs
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));