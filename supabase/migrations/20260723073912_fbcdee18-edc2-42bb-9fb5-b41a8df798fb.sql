-- Allow coaches with an explicit coach_athletes link to save training plans
-- for their athletes, even when the athlete lacks an active club_membership row
-- (their only club anchor may be profiles.club_id) and coach_athletes.club_id
-- is NULL. Matching UPDATE/SELECT policies so the write is reachable.

CREATE POLICY "Coaches insert linked athlete training_plans"
ON public.training_plans
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = training_plans.user_id
  )
);

CREATE POLICY "Coaches update linked athlete training_plans"
ON public.training_plans
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = training_plans.user_id
  )
);

CREATE POLICY "Coaches read linked athlete training_plans"
ON public.training_plans
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = training_plans.user_id
  )
);