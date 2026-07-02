
-- athlete_modules
DROP POLICY IF EXISTS "Coaches manage their athlete modules" ON public.athlete_modules;
CREATE POLICY "Coaches manage their athlete modules"
ON public.athlete_modules
FOR ALL
USING (
  auth.uid() = coach_id
  AND public.is_coach_of_athletes_club(athlete_id)
)
WITH CHECK (
  auth.uid() = coach_id
  AND public.is_coach_of_athletes_club(athlete_id)
);

-- coach_athlete_notes
DROP POLICY IF EXISTS "Coaches manage own notes" ON public.coach_athlete_notes;
CREATE POLICY "Coaches manage own notes"
ON public.coach_athlete_notes
FOR ALL
USING (
  auth.uid() = coach_id
  AND public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_coach_of_athletes_club(athlete_id)
)
WITH CHECK (
  auth.uid() = coach_id
  AND public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_coach_of_athletes_club(athlete_id)
);

-- match_videos
DROP POLICY IF EXISTS "Coach can manage own match videos" ON public.match_videos;
CREATE POLICY "Coach can manage own match videos"
ON public.match_videos
FOR ALL
USING (
  auth.uid() = coach_id
  AND public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_coach_of_athletes_club(athlete_id)
)
WITH CHECK (
  auth.uid() = coach_id
  AND public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_coach_of_athletes_club(athlete_id)
);
