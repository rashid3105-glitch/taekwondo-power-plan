CREATE POLICY "Coaches can view athlete diary entries"
ON public.diary_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = diary_entries.user_id
  )
);