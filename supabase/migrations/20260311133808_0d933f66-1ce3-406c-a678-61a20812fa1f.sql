CREATE POLICY "Coaches can delete athlete rehab plans"
ON public.rehab_plans
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = rehab_plans.user_id
  )
);