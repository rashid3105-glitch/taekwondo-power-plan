CREATE POLICY "Coaches can view club athletes profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_coach_of_athletes_club(user_id));