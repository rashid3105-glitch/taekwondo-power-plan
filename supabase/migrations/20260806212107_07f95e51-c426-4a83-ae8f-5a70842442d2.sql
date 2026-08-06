-- 1. club_techniques: replace flawed user_roles/profiles join with is_coach_of_club()
DROP POLICY IF EXISTS "Club coaches manage techniques" ON public.club_techniques;
CREATE POLICY "Club coaches manage techniques"
ON public.club_techniques FOR ALL TO authenticated
USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()))
WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Athletes read club techniques" ON public.club_techniques;
CREATE POLICY "Athletes read club techniques"
ON public.club_techniques FOR SELECT TO authenticated
USING (
  public.is_member_of_club(club_id)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = club_techniques.club_id)
);

-- 2. club_season_plans: writes require active coach/admin membership of that club
DROP POLICY IF EXISTS "Coaches manage own club season plans" ON public.club_season_plans;
CREATE POLICY "Coaches manage own club season plans"
ON public.club_season_plans FOR ALL TO authenticated
USING (
  (created_by = auth.uid() AND public.is_coach_of_club(club_id))
  OR public.is_coach_of_club(club_id)
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  (created_by = auth.uid() AND public.is_coach_of_club(club_id))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Club members read club season plans" ON public.club_season_plans;
CREATE POLICY "Club members read club season plans"
ON public.club_season_plans FOR SELECT TO authenticated
USING (
  public.is_member_of_club(club_id)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = club_season_plans.club_id)
);

-- 3. phases
DROP POLICY IF EXISTS "Coaches manage club phases" ON public.club_season_phases;
CREATE POLICY "Coaches manage club phases"
ON public.club_season_phases FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_phases.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_phases.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
));

DROP POLICY IF EXISTS "Club members read club phases" ON public.club_season_phases;
CREATE POLICY "Club members read club phases"
ON public.club_season_phases FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_phases.season_plan_id
    AND (
      public.is_member_of_club(sp.club_id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = sp.club_id)
    )
));

-- 4. day templates
DROP POLICY IF EXISTS "Club coaches manage day templates" ON public.club_season_day_templates;
CREATE POLICY "Club coaches manage day templates"
ON public.club_season_day_templates FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_day_templates.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_day_templates.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
));

DROP POLICY IF EXISTS "Club members read day templates" ON public.club_season_day_templates;
CREATE POLICY "Club members read day templates"
ON public.club_season_day_templates FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_day_templates.season_plan_id
    AND (
      public.is_member_of_club(sp.club_id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = sp.club_id)
    )
));

-- 5. visibility
DROP POLICY IF EXISTS "Coach manages visibility" ON public.club_season_plan_visibility;
CREATE POLICY "Coach manages visibility"
ON public.club_season_plan_visibility FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_plan_visibility.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.club_season_plans sp
  WHERE sp.id = club_season_plan_visibility.season_plan_id
    AND (public.is_coach_of_club(sp.club_id) OR public.is_admin(auth.uid()))
));