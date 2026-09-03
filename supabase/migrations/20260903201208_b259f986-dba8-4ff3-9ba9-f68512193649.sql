CREATE POLICY "Coaches update club physical_test_results"
ON public.physical_test_results
FOR UPDATE
TO authenticated
USING (((club_id IS NOT NULL) AND is_coach_of_club(club_id)) OR ((club_id IS NULL) AND is_coach_of_athletes_club(user_id)))
WITH CHECK (((club_id IS NOT NULL) AND is_coach_of_club(club_id)) OR ((club_id IS NULL) AND is_coach_of_athletes_club(user_id)));

CREATE POLICY "Users update own test results"
ON public.physical_test_results
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);