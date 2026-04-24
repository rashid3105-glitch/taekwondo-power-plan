-- ============ Per-exercise coach feedback ============
CREATE TABLE public.workout_log_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  reaction TEXT NOT NULL DEFAULT 'none',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workout_log_feedback_reaction_check CHECK (reaction IN ('none','thumbs_up','check_form','push_harder','redo','fire'))
);

CREATE INDEX idx_wlf_workout_log ON public.workout_log_feedback(workout_log_id);
CREATE INDEX idx_wlf_athlete ON public.workout_log_feedback(athlete_id, is_read);
CREATE INDEX idx_wlf_coach ON public.workout_log_feedback(coach_id);

ALTER TABLE public.workout_log_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes view feedback on own logs"
  ON public.workout_log_feedback FOR SELECT TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches view own feedback"
  ON public.workout_log_feedback FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches insert feedback for their athletes"
  ON public.workout_log_feedback FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = coach_id
    AND has_role(auth.uid(), 'coach'::app_role)
    AND (
      EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = workout_log_feedback.athlete_id)
      OR users_share_club(auth.uid(), workout_log_feedback.athlete_id)
    )
  );

CREATE POLICY "Coaches update own feedback"
  ON public.workout_log_feedback FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches delete own feedback"
  ON public.workout_log_feedback FOR DELETE TO authenticated
  USING (auth.uid() = coach_id);

CREATE TRIGGER trg_wlf_updated
  BEFORE UPDATE ON public.workout_log_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC for athletes to mark feedback read
CREATE OR REPLACE FUNCTION public.mark_workout_feedback_read(_feedback_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workout_log_feedback
  SET is_read = true
  WHERE id = _feedback_id
    AND athlete_id = auth.uid();
END;
$$;

-- ============ Season periodization plans ============
CREATE TABLE public.season_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Season Plan',
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT season_plans_dates_check CHECK (season_end >= season_start)
);

CREATE INDEX idx_season_plans_user ON public.season_plans(user_id, is_active);

ALTER TABLE public.season_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own season plans"
  ON public.season_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete season plans"
  ON public.season_plans FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = season_plans.user_id)
    OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), user_id))
  );

CREATE POLICY "Coaches edit managed athlete season plans"
  ON public.season_plans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = season_plans.user_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = season_plans.user_id));

CREATE POLICY "Coaches insert season plans for managed athletes"
  ON public.season_plans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = season_plans.user_id));

CREATE TRIGGER trg_season_plans_updated
  BEFORE UPDATE ON public.season_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();