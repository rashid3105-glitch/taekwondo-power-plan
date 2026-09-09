CREATE OR REPLACE FUNCTION public.is_coach_of_athletes_club(_athlete_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.club_memberships c
      JOIN public.club_memberships a ON a.club_id = c.club_id
      WHERE c.user_id = auth.uid()
        AND c.role_in_club IN ('coach','admin')
        AND c.status = 'active'
        AND a.user_id = _athlete_id
        AND a.status = 'active'
    )
    OR
    -- Athlete anchored to the club only through profiles.club_id
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.club_memberships c
        ON c.club_id = p.club_id
       AND c.user_id = auth.uid()
       AND c.role_in_club IN ('coach','admin')
       AND c.status = 'active'
      WHERE p.user_id = _athlete_id
        AND p.club_id IS NOT NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      JOIN public.club_memberships c
        ON c.user_id = ca.coach_id
       AND c.club_id = ca.club_id
       AND c.role_in_club IN ('coach','admin')
       AND c.status = 'active'
      WHERE ca.coach_id = auth.uid()
        AND ca.athlete_id = _athlete_id
        AND ca.club_id IS NOT NULL
    );
$function$;