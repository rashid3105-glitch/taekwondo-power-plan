CREATE TABLE IF NOT EXISTS public.ai_assistant_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  shared_with_coach boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_assistant_logs TO authenticated;
GRANT ALL ON public.ai_assistant_logs TO service_role;

ALTER TABLE public.ai_assistant_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own AI logs"
  ON public.ai_assistant_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches read shared AI logs for their athletes"
  ON public.ai_assistant_logs FOR SELECT
  TO authenticated
  USING (
    shared_with_coach = true AND
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_id = auth.uid() AND athlete_id = ai_assistant_logs.user_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_user_id_created
  ON public.ai_assistant_logs(user_id, created_at DESC);