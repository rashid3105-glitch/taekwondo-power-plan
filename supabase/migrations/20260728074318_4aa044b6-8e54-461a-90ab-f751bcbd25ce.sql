DROP POLICY IF EXISTS "Coaches manage club day templates" ON public.club_season_day_templates;
CREATE POLICY "Club coaches manage day templates"
ON public.club_season_day_templates FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_day_templates.season_plan_id
    AND (sp.created_by = auth.uid() OR public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_day_templates.season_plan_id
    AND (sp.created_by = auth.uid() OR public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_season_day_templates TO authenticated;
GRANT ALL ON public.club_season_day_templates TO service_role;