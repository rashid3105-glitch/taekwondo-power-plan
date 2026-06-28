CREATE POLICY "Coaches and admins can delete reports for their athletes"
ON public.monthly_development_reports FOR DELETE
USING (
  is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() AND ca.athlete_id = monthly_development_reports.athlete_user_id
  )
);