CREATE TABLE public.weight_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  start_weight_kg numeric NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_weight_kg numeric NOT NULL,
  target_date date,
  rate_kg_per_week numeric NOT NULL DEFAULT 0.5,
  direction text NOT NULL DEFAULT 'loss',
  set_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX weight_goals_user_active_idx ON public.weight_goals (user_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_goals TO authenticated;
GRANT ALL ON public.weight_goals TO service_role;

ALTER TABLE public.weight_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own weight goals"
ON public.weight_goals FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches read club athlete weight goals"
ON public.weight_goals FOR SELECT TO authenticated
USING (public.is_coach_of_athletes_club(user_id));

CREATE POLICY "Coaches insert weight goals for managed athletes"
ON public.weight_goals FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.coach_athletes ca
  WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_goals.user_id
));

CREATE POLICY "Coaches update weight goals for managed athletes"
ON public.weight_goals FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coach_athletes ca
  WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_goals.user_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.coach_athletes ca
  WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_goals.user_id
));

CREATE POLICY "Parents read child weight goals"
ON public.weight_goals FOR SELECT TO authenticated
USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Admins read all weight goals"
ON public.weight_goals FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_weight_goals_updated_at
BEFORE UPDATE ON public.weight_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();