CREATE POLICY "Athletes can view own monthly reports"
  ON public.monthly_development_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = athlete_user_id);

CREATE POLICY "Athletes can view own report jobs"
  ON public.monthly_report_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = athlete_user_id);