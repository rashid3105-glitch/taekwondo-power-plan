CREATE TABLE public.competition_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  competition_name TEXT,
  competition_date DATE,
  result TEXT,
  ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  reflections JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_plan JSONB,
  next_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_comp_reflections_user_date
  ON public.competition_reflections(user_id, competition_date DESC NULLS LAST, created_at DESC);

ALTER TABLE public.competition_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
  ON public.competition_reflections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
  ON public.competition_reflections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
  ON public.competition_reflections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections"
  ON public.competition_reflections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view managed athlete reflections"
  ON public.competition_reflections FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() AND ca.athlete_id = competition_reflections.user_id
  ));

CREATE POLICY "Coaches can view club member reflections"
  ON public.competition_reflections FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), user_id));

CREATE TRIGGER update_competition_reflections_updated_at
BEFORE UPDATE ON public.competition_reflections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();