
-- 1) Prevent self privilege escalation in club_memberships
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service_role / server-side jobs
  END IF;
  IF public.is_admin(auth.uid()) OR public.is_superadmin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid()
     AND NEW.role_in_club IN ('coach','admin')
     AND (TG_OP = 'INSERT' OR OLD.role_in_club IS DISTINCT FROM NEW.role_in_club) THEN
    RAISE EXCEPTION 'Not allowed to grant yourself an elevated club role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_escalation_trg ON public.club_memberships;
CREATE TRIGGER prevent_self_role_escalation_trg
BEFORE INSERT OR UPDATE ON public.club_memberships
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- Scope membership policies to authenticated users only
DROP POLICY IF EXISTS "coach deletes club memberships" ON public.club_memberships;
CREATE POLICY "coach deletes club memberships" ON public.club_memberships
  FOR DELETE TO authenticated USING (public.is_coach_of_club(club_id));

DROP POLICY IF EXISTS "coach inserts club memberships" ON public.club_memberships;
CREATE POLICY "coach inserts club memberships" ON public.club_memberships
  FOR INSERT TO authenticated WITH CHECK (public.is_coach_of_club(club_id));

DROP POLICY IF EXISTS "coach updates club memberships" ON public.club_memberships;
CREATE POLICY "coach updates club memberships" ON public.club_memberships
  FOR UPDATE TO authenticated USING (public.is_coach_of_club(club_id)) WITH CHECK (public.is_coach_of_club(club_id));

DROP POLICY IF EXISTS "members read own or coach reads club" ON public.club_memberships;
CREATE POLICY "members read own or coach reads club" ON public.club_memberships
  FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR public.is_coach_of_club(club_id));

-- 2) Remove profiles-based fallback for season day templates
DROP POLICY IF EXISTS "Club members read day templates" ON public.club_season_day_templates;
CREATE POLICY "Club members read day templates" ON public.club_season_day_templates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.club_season_plans sp
    WHERE sp.id = club_season_day_templates.season_plan_id
      AND public.is_member_of_club(sp.club_id)
  ));
