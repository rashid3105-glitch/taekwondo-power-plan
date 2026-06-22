
CREATE TABLE public.coach_mental_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score integer NOT NULL DEFAULT 0,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_advice text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_mental_assessments_user ON public.coach_mental_assessments(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_mental_assessments TO authenticated;
GRANT ALL ON public.coach_mental_assessments TO service_role;

ALTER TABLE public.coach_mental_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view their own mental assessments"
  ON public.coach_mental_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches insert their own mental assessments"
  ON public.coach_mental_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches update their own mental assessments"
  ON public.coach_mental_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches delete their own mental assessments"
  ON public.coach_mental_assessments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
