DROP POLICY IF EXISTS "Athletes view targeted surveys" ON public.surveys;

CREATE POLICY "Athletes view targeted surveys"
ON public.surveys
FOR SELECT
TO authenticated
USING (public.is_survey_target(id, auth.uid()));