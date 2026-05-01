CREATE TABLE public.health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps int8,
  heart_rate_avg float8,
  hrv float8,
  sleep_hours float8,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_health_data_user_date ON public.health_data (user_id, date DESC);

ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own health data"
  ON public.health_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete health data"
  ON public.health_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() AND ca.athlete_id = health_data.user_id
    )
    OR (public.has_role(auth.uid(), 'coach'::app_role) AND public.users_share_club(auth.uid(), user_id))
  );