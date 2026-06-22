
-- 1) blog_comments: add explicit RESTRICTIVE policy so only admins (and superadmin via existing permissive) can SELECT.
-- Public comments are exposed via SECURITY DEFINER function public.get_blog_comments(), so direct table SELECT for anon/authenticated must remain blocked.
CREATE POLICY "Block non-admin reads of blog comments"
  ON public.blog_comments
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (public.is_admin(auth.uid()) OR public.is_superadmin(auth.uid()));

-- 2) club_week_technique_focus: replace coach policy with one that verifies the user is a coach/admin OF THE SPECIFIC CLUB.
DROP POLICY IF EXISTS "Coaches manage week focus" ON public.club_week_technique_focus;

CREATE POLICY "Coaches manage week focus"
  ON public.club_week_technique_focus
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_season_plans sp
      WHERE sp.id = club_week_technique_focus.season_plan_id
        AND public.is_coach_of_club(sp.club_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_season_plans sp
      WHERE sp.id = club_week_technique_focus.season_plan_id
        AND public.is_coach_of_club(sp.club_id)
    )
  );
