
-- Monthly development reports (coach-only summaries per athlete per month)
CREATE TABLE IF NOT EXISTS public.monthly_development_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  period_year int NOT NULL CHECK (period_year BETWEEN 2024 AND 2100),
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  summary_text text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  locale text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_user_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_athlete_period
  ON public.monthly_development_reports (athlete_user_id, period_year DESC, period_month DESC);

GRANT SELECT ON public.monthly_development_reports TO authenticated;
GRANT ALL ON public.monthly_development_reports TO service_role;

ALTER TABLE public.monthly_development_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and admins can view reports for their athletes"
ON public.monthly_development_reports
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = monthly_development_reports.athlete_user_id
  )
);

-- Job queue for batched generation
CREATE TABLE IF NOT EXISTS public.monthly_report_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_user_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_report_jobs_status
  ON public.monthly_report_jobs (status, created_at);

GRANT ALL ON public.monthly_report_jobs TO service_role;
ALTER TABLE public.monthly_report_jobs ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

CREATE TRIGGER trg_monthly_report_jobs_updated
  BEFORE UPDATE ON public.monthly_report_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification badge counter on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coach_unread_reports_count int NOT NULL DEFAULT 0;

-- RPC: clear badge when coach opens the reports area
CREATE OR REPLACE FUNCTION public.mark_monthly_reports_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.profiles
     SET coach_unread_reports_count = 0
   WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_monthly_reports_seen() TO authenticated;

-- Enqueue function: called by pg_cron on the 1st of each month for previous month
CREATE OR REPLACE FUNCTION public.enqueue_monthly_reports()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int;
  v_month int;
  v_period_start date;
  v_period_end date;
  v_inserted int := 0;
BEGIN
  v_period_start := date_trunc('month', (CURRENT_DATE - INTERVAL '1 month'))::date;
  v_period_end := (date_trunc('month', CURRENT_DATE))::date;
  v_year := EXTRACT(YEAR FROM v_period_start)::int;
  v_month := EXTRACT(MONTH FROM v_period_start)::int;

  WITH active_athletes AS (
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    JOIN public.clubs c ON c.id = p.club_id
    WHERE c.license_active = true
      AND c.deleted_at IS NULL
      AND (
        EXISTS (SELECT 1 FROM public.diary_entries d
                 WHERE d.user_id = p.user_id
                   AND d.entry_date >= v_period_start AND d.entry_date < v_period_end)
        OR EXISTS (SELECT 1 FROM public.workout_logs w
                    WHERE w.user_id = p.user_id
                      AND w.logged_date >= v_period_start AND w.logged_date < v_period_end)
        OR EXISTS (SELECT 1 FROM public.mental_assessments m
                    WHERE m.user_id = p.user_id
                      AND m.created_at >= v_period_start AND m.created_at < v_period_end)
        OR EXISTS (SELECT 1 FROM public.physical_test_results t
                    WHERE t.user_id = p.user_id
                      AND t.test_date >= v_period_start AND t.test_date < v_period_end)
        OR EXISTS (SELECT 1 FROM public.wearable_daily_summary s
                    WHERE s.user_id = p.user_id
                      AND s.summary_date >= v_period_start AND s.summary_date < v_period_end)
      )
  )
  INSERT INTO public.monthly_report_jobs (athlete_user_id, period_year, period_month)
  SELECT user_id, v_year, v_month FROM active_athletes
  ON CONFLICT (athlete_user_id, period_year, period_month) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;
