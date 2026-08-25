-- Phase 2a: scope coach access by row club_id instead of shared-club membership

DROP POLICY "Coach of athlete club reads consent" ON public.consent_records;
CREATE POLICY "Coach of athlete club reads consent" ON public.consent_records
  FOR SELECT TO authenticated
  USING (is_coach_of_club(club_id));

DROP POLICY "Coaches and admins can view reports for their athletes" ON public.monthly_development_reports;
CREATE POLICY "Coaches and admins can view reports for their athletes" ON public.monthly_development_reports
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = monthly_development_reports.athlete_user_id))
    OR is_coach_of_club(club_id)
  );

DROP POLICY "Coaches and admins can delete reports for their athletes" ON public.monthly_development_reports;
CREATE POLICY "Coaches and admins can delete reports for their athletes" ON public.monthly_development_reports
  FOR DELETE
  USING (
    is_admin(auth.uid())
    OR (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = monthly_development_reports.athlete_user_id))
    OR is_coach_of_club(club_id)
  );

DROP POLICY "Coaches read club athlete weight goals" ON public.weight_goals;
CREATE POLICY "Coaches read club athlete weight goals" ON public.weight_goals
  FOR SELECT TO authenticated
  USING (is_coach_of_club(club_id));

DROP POLICY "Coaches can view their club athletes running programs" ON public.running_program_enrollments;
CREATE POLICY "Coaches can view their club athletes running programs" ON public.running_program_enrollments
  FOR SELECT TO authenticated
  USING (is_coach_of_club(club_id) OR is_superadmin(auth.uid()));

DROP POLICY "Coaches manage own notes" ON public.coach_athlete_notes;
CREATE POLICY "Coaches manage own notes" ON public.coach_athlete_notes
  FOR ALL
  USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id))
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id));

DROP POLICY "Coach can manage own match videos" ON public.match_videos;
CREATE POLICY "Coach can manage own match videos" ON public.match_videos
  FOR ALL
  USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id))
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id));

DROP POLICY "Coaches manage their athlete modules" ON public.athlete_modules;
CREATE POLICY "Coaches manage their athlete modules" ON public.athlete_modules
  FOR ALL
  USING (auth.uid() = coach_id AND is_coach_of_club(club_id))
  WITH CHECK (auth.uid() = coach_id AND is_coach_of_club(club_id));

DROP POLICY "Coaches manage athlete overrides in club" ON public.athlete_module_overrides;
CREATE POLICY "Coaches manage athlete overrides in club" ON public.athlete_module_overrides
  FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) AND is_coach_of_club(club_id));

DROP POLICY "Coaches manage athlete focus" ON public.athlete_week_technique_focus;
CREATE POLICY "Coaches manage athlete focus" ON public.athlete_week_technique_focus
  FOR ALL
  USING (
    is_admin(auth.uid())
    OR (has_role(auth.uid(), 'coach'::app_role) AND (
      (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_week_technique_focus.athlete_id))
      OR is_coach_of_club(club_id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (has_role(auth.uid(), 'coach'::app_role) AND (
      (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_week_technique_focus.athlete_id))
      OR is_coach_of_club(club_id)
    ))
  );
