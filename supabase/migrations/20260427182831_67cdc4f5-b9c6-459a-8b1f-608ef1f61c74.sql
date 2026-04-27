
-- Profile flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owns_wearable boolean NOT NULL DEFAULT false;

-- Connections
CREATE TABLE public.wearable_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('apple_health','health_connect')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','error')),
  granted_scopes text[] NOT NULL DEFAULT '{}',
  device_label text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TRIGGER trg_wearable_connections_updated
  BEFORE UPDATE ON public.wearable_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wearable connections"
  ON public.wearable_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete wearable connections"
  ON public.wearable_connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.coach_athletes ca
            WHERE ca.coach_id = auth.uid() AND ca.athlete_id = wearable_connections.user_id)
    OR (public.has_role(auth.uid(),'coach'::app_role) AND public.users_share_club(auth.uid(), user_id))
  );

-- Raw samples
CREATE TABLE public.wearable_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('sleep','resting_hr','hrv','steps','workout')),
  value_numeric numeric,
  unit text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  source_device text,
  external_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, metric_type, external_id)
);

CREATE INDEX idx_wearable_samples_user_metric_start
  ON public.wearable_samples (user_id, metric_type, start_at DESC);

ALTER TABLE public.wearable_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wearable samples"
  ON public.wearable_samples FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Derived daily summary
CREATE TABLE public.wearable_daily_summary (
  user_id uuid NOT NULL,
  summary_date date NOT NULL,
  sleep_minutes integer,
  resting_hr numeric,
  hrv_rmssd numeric,
  steps integer,
  workout_count integer NOT NULL DEFAULT 0,
  baseline_hr_7d numeric,
  baseline_hrv_7d numeric,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, summary_date)
);

ALTER TABLE public.wearable_daily_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wearable summary"
  ON public.wearable_daily_summary FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete wearable summary"
  ON public.wearable_daily_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.coach_athletes ca
            WHERE ca.coach_id = auth.uid() AND ca.athlete_id = wearable_daily_summary.user_id)
    OR (public.has_role(auth.uid(),'coach'::app_role) AND public.users_share_club(auth.uid(), user_id))
  );

-- Recompute helper (called by edge function after ingest)
CREATE OR REPLACE FUNCTION public.recompute_wearable_summary(_user_id uuid, _from date, _to date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE d date;
BEGIN
  d := _from;
  WHILE d <= _to LOOP
    INSERT INTO public.wearable_daily_summary AS s (
      user_id, summary_date, sleep_minutes, resting_hr, hrv_rmssd, steps, workout_count, computed_at
    )
    SELECT
      _user_id, d,
      (SELECT COALESCE(SUM(value_numeric),0)::int FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='sleep'
          AND start_at >= d - INTERVAL '1 day' + TIME '18:00'
          AND start_at <  d + TIME '12:00'),
      (SELECT AVG(value_numeric) FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='resting_hr'
          AND start_at::date = d),
      (SELECT AVG(value_numeric) FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='hrv'
          AND start_at::date = d),
      (SELECT COALESCE(SUM(value_numeric),0)::int FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='steps'
          AND start_at::date = d),
      (SELECT COUNT(*) FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='workout'
          AND start_at::date = d),
      now()
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
      sleep_minutes = EXCLUDED.sleep_minutes,
      resting_hr    = EXCLUDED.resting_hr,
      hrv_rmssd     = EXCLUDED.hrv_rmssd,
      steps         = EXCLUDED.steps,
      workout_count = EXCLUDED.workout_count,
      computed_at   = now();
    d := d + 1;
  END LOOP;

  -- Refresh 7-day baselines for the affected window
  UPDATE public.wearable_daily_summary tgt
  SET baseline_hr_7d = sub.b_hr,
      baseline_hrv_7d = sub.b_hrv
  FROM (
    SELECT s1.summary_date,
           AVG(s2.resting_hr) AS b_hr,
           AVG(s2.hrv_rmssd)  AS b_hrv
    FROM public.wearable_daily_summary s1
    LEFT JOIN public.wearable_daily_summary s2
      ON s2.user_id = s1.user_id
     AND s2.summary_date BETWEEN s1.summary_date - 7 AND s1.summary_date - 1
    WHERE s1.user_id = _user_id
      AND s1.summary_date BETWEEN _from AND _to
    GROUP BY s1.summary_date
  ) sub
  WHERE tgt.user_id = _user_id AND tgt.summary_date = sub.summary_date;
END;
$$;
