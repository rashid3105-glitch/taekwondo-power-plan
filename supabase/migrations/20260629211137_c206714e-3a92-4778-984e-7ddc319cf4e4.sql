
DROP POLICY IF EXISTS "Coaches manage club session_attendance v3" ON public.session_attendance;

CREATE POLICY "Coaches manage club session_attendance v4"
ON public.session_attendance
FOR ALL
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND (
    (club_id IS NOT NULL AND is_coach_of_club(club_id))
    OR (club_id IS NULL AND is_coach_of_athletes_club(athlete_id))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role)
  AND is_coach_of_athletes_club(athlete_id)
  AND (club_id IS NULL OR is_coach_of_club(club_id))
);
