
DROP POLICY IF EXISTS "Coaches view club mate profiles" ON public.profiles;

CREATE POLICY "Coaches view linked athletes workout logs"
ON public.workout_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = workout_logs.user_id
  )
);
