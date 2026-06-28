DROP POLICY IF EXISTS "Coaches and admins can delete reports for their athletes" ON public.monthly_development_reports;
DROP POLICY IF EXISTS "Coaches and admins can view reports for their athletes" ON public.monthly_development_reports;

CREATE POLICY "Coaches and admins can view reports for their athletes"
ON public.monthly_development_reports FOR SELECT
USING (
  is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = monthly_development_reports.athlete_user_id)
  OR is_coach_of_athletes_club(athlete_user_id)
);

CREATE POLICY "Coaches and admins can delete reports for their athletes"
ON public.monthly_development_reports FOR DELETE
USING (
  is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = monthly_development_reports.athlete_user_id)
  OR is_coach_of_athletes_club(athlete_user_id)
);