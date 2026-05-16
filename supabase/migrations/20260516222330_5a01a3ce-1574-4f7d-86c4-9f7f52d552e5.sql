
CREATE TABLE public.club_season_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.club_season_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own club season plans" ON public.club_season_plans FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Club members read club season plans" ON public.club_season_plans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = club_season_plans.club_id));

CREATE TABLE public.club_season_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  focus_label text,
  color text NOT NULL DEFAULT '#3b82f6',
  start_week int NOT NULL,
  end_week int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.club_season_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage club phases" ON public.club_season_phases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_season_phases.season_plan_id AND sp.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_season_phases.season_plan_id AND sp.created_by = auth.uid()));

CREATE POLICY "Club members read club phases" ON public.club_season_phases FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.club_season_plans sp
    JOIN public.profiles p ON p.club_id = sp.club_id
    WHERE sp.id = club_season_phases.season_plan_id AND p.user_id = auth.uid()
  ));

CREATE TABLE public.club_season_day_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  session_type text NOT NULL DEFAULT 'rest',
  location text,
  notes text,
  UNIQUE (season_plan_id, day_of_week)
);
ALTER TABLE public.club_season_day_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage club day templates" ON public.club_season_day_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_season_day_templates.season_plan_id AND sp.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_season_day_templates.season_plan_id AND sp.created_by = auth.uid()));

CREATE POLICY "Club members read day templates" ON public.club_season_day_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.club_season_plans sp
    JOIN public.profiles p ON p.club_id = sp.club_id
    WHERE sp.id = club_season_day_templates.season_plan_id AND p.user_id = auth.uid()
  ));

CREATE TABLE public.club_athlete_season_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  override_date date NOT NULL,
  session_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_plan_id, athlete_id, override_date)
);
ALTER TABLE public.club_athlete_season_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage athlete overrides" ON public.club_athlete_season_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_athlete_season_overrides.season_plan_id AND sp.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp WHERE sp.id = club_athlete_season_overrides.season_plan_id AND sp.created_by = auth.uid()));

CREATE POLICY "Athletes read own season overrides" ON public.club_athlete_season_overrides FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Parents read linked athlete season overrides" ON public.club_athlete_season_overrides FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), athlete_id));

CREATE INDEX idx_club_season_plans_club ON public.club_season_plans(club_id, is_active);
CREATE INDEX idx_club_season_phases_plan ON public.club_season_phases(season_plan_id);
CREATE INDEX idx_club_season_overrides_plan_athlete ON public.club_athlete_season_overrides(season_plan_id, athlete_id);
