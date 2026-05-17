CREATE TABLE public.club_season_plan_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_plan_id, athlete_id)
);
ALTER TABLE public.club_season_plan_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages visibility" ON public.club_season_plan_visibility FOR ALL
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = season_plan_id AND sp.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = season_plan_id AND sp.created_by = auth.uid()));
CREATE POLICY "Athletes read own visibility" ON public.club_season_plan_visibility FOR SELECT
  USING (athlete_id = auth.uid());