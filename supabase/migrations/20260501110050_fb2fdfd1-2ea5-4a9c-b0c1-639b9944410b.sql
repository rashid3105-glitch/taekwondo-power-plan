-- 1. Trigger function: mirror health_data → wearable_daily_summary
CREATE OR REPLACE FUNCTION public.mirror_health_data_to_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wearable_daily_summary AS s (
    user_id, summary_date,
    steps, sleep_minutes, resting_hr, hrv_rmssd,
    workout_count, computed_at
  )
  VALUES (
    NEW.user_id, NEW.date,
    COALESCE(NEW.steps, 0)::int,
    CASE WHEN NEW.sleep_hours IS NOT NULL THEN ROUND(NEW.sleep_hours * 60)::int ELSE NULL END,
    NEW.heart_rate_avg,
    NEW.hrv,
    0,
    now()
  )
  ON CONFLICT (user_id, summary_date) DO UPDATE SET
    -- Only fill fields when the incoming value is non-null,
    -- so manual entries are never wiped by a sparser iPhone payload.
    steps         = COALESCE(EXCLUDED.steps, s.steps),
    sleep_minutes = COALESCE(EXCLUDED.sleep_minutes, s.sleep_minutes),
    resting_hr    = COALESCE(EXCLUDED.resting_hr, s.resting_hr),
    hrv_rmssd     = COALESCE(EXCLUDED.hrv_rmssd, s.hrv_rmssd),
    computed_at   = now();

  -- Refresh 7-day baselines for this date
  PERFORM public.recompute_wearable_summary(NEW.user_id, NEW.date, NEW.date);

  RETURN NEW;
END;
$$;

-- 2. Trigger on health_data inserts and updates
DROP TRIGGER IF EXISTS trg_mirror_health_data ON public.health_data;
CREATE TRIGGER trg_mirror_health_data
AFTER INSERT OR UPDATE ON public.health_data
FOR EACH ROW
EXECUTE FUNCTION public.mirror_health_data_to_summary();

-- 3. Backfill existing health_data rows into wearable_daily_summary
INSERT INTO public.wearable_daily_summary AS s (
  user_id, summary_date,
  steps, sleep_minutes, resting_hr, hrv_rmssd,
  workout_count, computed_at
)
SELECT
  h.user_id, h.date,
  COALESCE(h.steps, 0)::int,
  CASE WHEN h.sleep_hours IS NOT NULL THEN ROUND(h.sleep_hours * 60)::int ELSE NULL END,
  h.heart_rate_avg,
  h.hrv,
  0,
  now()
FROM public.health_data h
ON CONFLICT (user_id, summary_date) DO UPDATE SET
  steps         = COALESCE(EXCLUDED.steps, s.steps),
  sleep_minutes = COALESCE(EXCLUDED.sleep_minutes, s.sleep_minutes),
  resting_hr    = COALESCE(EXCLUDED.resting_hr, s.resting_hr),
  hrv_rmssd     = COALESCE(EXCLUDED.hrv_rmssd, s.hrv_rmssd),
  computed_at   = now();

-- 4. Recompute baselines for every user that had backfilled data
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT user_id, MIN(date) AS d_min, MAX(date) AS d_max
    FROM public.health_data
    GROUP BY user_id
  LOOP
    PERFORM public.recompute_wearable_summary(r.user_id, r.d_min, r.d_max);
  END LOOP;
END $$;