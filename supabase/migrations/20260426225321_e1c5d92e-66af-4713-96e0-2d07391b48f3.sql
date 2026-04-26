-- Replace FOR ALL policy with explicit per-command policies (linter friendly).
DROP POLICY IF EXISTS "Coaches manage own reflection comments" ON public.coach_reflection_comments;

CREATE POLICY "Coaches view own reflection comments"
ON public.coach_reflection_comments
FOR SELECT
TO authenticated
USING (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "Coaches insert own reflection comments"
ON public.coach_reflection_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = coach_reflection_comments.athlete_id)
    OR users_share_club(auth.uid(), coach_reflection_comments.athlete_id)
  )
);

CREATE POLICY "Coaches update own reflection comments"
ON public.coach_reflection_comments
FOR UPDATE
TO authenticated
USING (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = coach_reflection_comments.athlete_id)
    OR users_share_club(auth.uid(), coach_reflection_comments.athlete_id)
  )
);

CREATE POLICY "Coaches delete own reflection comments"
ON public.coach_reflection_comments
FOR DELETE
TO authenticated
USING (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
);