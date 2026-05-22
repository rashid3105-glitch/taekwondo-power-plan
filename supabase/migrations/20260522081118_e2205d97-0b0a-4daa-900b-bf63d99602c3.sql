-- Allow coaches to insert competitions for athletes they coach
CREATE POLICY "Coaches can insert competitions for their athletes"
  ON public.competitions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_id = auth.uid()
      AND athlete_id = competitions.user_id
    )
  );

-- Allow coaches to delete competitions for athletes they coach
CREATE POLICY "Coaches can delete competitions for their athletes"
  ON public.competitions FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_id = auth.uid()
      AND athlete_id = competitions.user_id
    )
  );