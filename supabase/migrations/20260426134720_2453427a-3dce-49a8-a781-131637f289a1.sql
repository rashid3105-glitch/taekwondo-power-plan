-- Allow coaches to read mental assessments for athletes they manage,
-- and for athletes that share a club with them (read-only club view).

CREATE POLICY "Coaches can view athlete mental assessments"
ON public.mental_assessments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = mental_assessments.user_id
  )
);

CREATE POLICY "Coaches can view club member mental assessments"
ON public.mental_assessments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::public.app_role)
  AND public.users_share_club(auth.uid(), user_id)
);