-- Technique library per club
CREATE TABLE public.club_techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'attack',
  discipline text NOT NULL DEFAULT 'both',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, name)
);
ALTER TABLE public.club_techniques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Club coaches manage techniques"
  ON public.club_techniques FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.user_id = ur.user_id WHERE ur.user_id = auth.uid() AND (ur.role = 'coach' OR ur.role = 'admin') AND p.club_id = club_techniques.club_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.user_id = ur.user_id WHERE ur.user_id = auth.uid() AND (ur.role = 'coach' OR ur.role = 'admin') AND p.club_id = club_techniques.club_id));
CREATE POLICY "Athletes read club techniques"
  ON public.club_techniques FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND club_id = club_techniques.club_id));

-- Team technique focus per season-week
CREATE TABLE public.club_week_technique_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  season_week int NOT NULL,
  technique_ids uuid[] NOT NULL DEFAULT '{}',
  coach_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_plan_id, season_week)
);
ALTER TABLE public.club_week_technique_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage week focus"
  ON public.club_week_technique_focus FOR ALL
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp JOIN public.profiles p ON p.club_id = sp.club_id WHERE sp.id = season_plan_id AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('coach','admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.club_season_plans sp JOIN public.profiles p ON p.club_id = sp.club_id WHERE sp.id = season_plan_id AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('coach','admin'))));
CREATE POLICY "Athletes read week focus"
  ON public.club_week_technique_focus FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.club_season_plans sp JOIN public.profiles p ON p.club_id = sp.club_id WHERE sp.id = season_plan_id AND p.user_id = auth.uid()));

-- Individual athlete technique overrides per season-week
CREATE TABLE public.athlete_week_technique_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_plan_id uuid NOT NULL REFERENCES public.club_season_plans(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_week int NOT NULL,
  technique_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_plan_id, athlete_id, season_week)
);
ALTER TABLE public.athlete_week_technique_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage athlete focus"
  ON public.athlete_week_technique_focus FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('coach','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('coach','admin')));
CREATE POLICY "Athletes read own focus"
  ON public.athlete_week_technique_focus FOR SELECT
  USING (athlete_id = auth.uid());