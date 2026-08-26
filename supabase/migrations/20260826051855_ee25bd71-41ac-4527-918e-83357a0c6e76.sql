CREATE OR REPLACE FUNCTION public.athlete_active_club_count(_athlete_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 0
    WHEN auth.uid() = _athlete_id
      OR public.is_superadmin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.club_memberships cm
        WHERE cm.user_id = _athlete_id
          AND cm.status = 'active'
          AND public.is_coach_of_club(cm.club_id)
      )
    THEN (
      SELECT COUNT(DISTINCT cm2.club_id)::int
      FROM public.club_memberships cm2
      WHERE cm2.user_id = _athlete_id AND cm2.status = 'active'
    )
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.athlete_active_club_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.athlete_active_club_count(uuid) TO authenticated, service_role;