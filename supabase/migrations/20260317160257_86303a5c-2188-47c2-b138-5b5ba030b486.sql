CREATE OR REPLACE FUNCTION public.users_share_club(_first_user_id UUID, _second_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p1
    JOIN public.profiles p2
      ON p1.club_id = p2.club_id
    WHERE p1.user_id = _first_user_id
      AND p2.user_id = _second_user_id
      AND p1.club_id IS NOT NULL
  )
$$;

DROP POLICY IF EXISTS "Coaches can add athletes" ON public.coach_athletes;

CREATE POLICY "Coaches can add athletes"
ON public.coach_athletes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND public.users_share_club(coach_id, athlete_id)
);