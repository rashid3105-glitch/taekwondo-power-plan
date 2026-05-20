CREATE POLICY "Club members can view each other's profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.users_share_club(auth.uid(), user_id));