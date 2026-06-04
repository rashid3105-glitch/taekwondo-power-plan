CREATE TABLE public.competition_reflection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  club_id uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, athlete_id)
);

GRANT SELECT, INSERT, DELETE ON public.competition_reflection_requests TO authenticated;
GRANT ALL ON public.competition_reflection_requests TO service_role;

ALTER TABLE public.competition_reflection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes view their own reflection requests"
ON public.competition_reflection_requests FOR SELECT TO authenticated
USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches view their own reflection requests"
ON public.competition_reflection_requests FOR SELECT TO authenticated
USING (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = competition_reflection_requests.athlete_id)
    OR users_share_club(auth.uid(), competition_reflection_requests.athlete_id)
  )
);

CREATE POLICY "Coaches insert reflection requests for their athletes"
ON public.competition_reflection_requests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = competition_reflection_requests.athlete_id)
    OR users_share_club(auth.uid(), competition_reflection_requests.athlete_id)
  )
);

CREATE POLICY "Coaches delete their own reflection requests"
ON public.competition_reflection_requests FOR DELETE TO authenticated
USING (auth.uid() = coach_id);

CREATE INDEX idx_comp_refl_requests_athlete ON public.competition_reflection_requests(athlete_id, requested_at DESC);
CREATE INDEX idx_comp_refl_requests_comp ON public.competition_reflection_requests(competition_id);