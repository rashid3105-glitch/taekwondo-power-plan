
-- Tighten club_module_defaults SELECT to users within the same club (plus admins)
DROP POLICY IF EXISTS "Authenticated read club module defaults" ON public.club_module_defaults;

CREATE POLICY "Club members read club module defaults"
ON public.club_module_defaults
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.club_id = club_module_defaults.club_id
  )
);

-- Tighten coach_license_fields SELECT to the owning coach, their linked athletes, club coaches, or admins
DROP POLICY IF EXISTS "Authenticated read coach fields" ON public.coach_license_fields;

CREATE POLICY "Coach and linked athletes read coach fields"
ON public.coach_license_fields
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR coach_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = coach_license_fields.coach_id
      AND ca.athlete_id = auth.uid()
  )
  OR (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND public.users_share_club(auth.uid(), coach_license_fields.coach_id)
  )
);
