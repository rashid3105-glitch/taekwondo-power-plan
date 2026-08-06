CREATE OR REPLACE FUNCTION public.recompute_wearable_summary(_user_id uuid, _from date, _to date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
  v_sleep int;
  v_rhr numeric;
  v_hrv numeric;
  v_steps int;
  v_workouts int;
  v_hr numeric;
  v_energy numeric;
BEGIN
  d := _from;
  WHILE d <= _to LOOP
    -- NULL when there are no samples for that metric on that day, so the
    -- existing (possibly manually entered) value is preserved below.
    SELECT SUM(value_numeric)::int INTO v_sleep
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='sleep'
        AND start_at >= d - INTERVAL '1 day' + TIME '18:00'
        AND start_at <  d + TIME '12:00';

    SELECT AVG(value_numeric) INTO v_rhr
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='resting_hr' AND start_at::date = d;

    SELECT AVG(value_numeric) INTO v_hrv
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='hrv' AND start_at::date = d;

    SELECT SUM(value_numeric)::int INTO v_steps
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='steps' AND start_at::date = d;

    SELECT NULLIF(COUNT(*), 0)::int INTO v_workouts
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='workout' AND start_at::date = d;

    SELECT AVG(value_numeric) INTO v_hr
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='heart_rate' AND start_at::date = d;

    SELECT SUM(value_numeric) INTO v_energy
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='active_energy' AND start_at::date = d;

    INSERT INTO public.wearable_daily_summary AS s (
      user_id, summary_date, sleep_minutes, resting_hr, hrv_rmssd, steps,
      workout_count, heart_rate_avg, active_energy_kcal, computed_at
    )
    VALUES (
      _user_id, d, v_sleep, v_rhr, v_hrv, v_steps,
      COALESCE(v_workouts, 0), v_hr, v_energy, now()
    )
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
      sleep_minutes      = COALESCE(EXCLUDED.sleep_minutes, s.sleep_minutes),
      resting_hr         = COALESCE(EXCLUDED.resting_hr, s.resting_hr),
      hrv_rmssd          = COALESCE(EXCLUDED.hrv_rmssd, s.hrv_rmssd),
      steps              = COALESCE(NULLIF(EXCLUDED.steps, 0), s.steps),
      workout_count      = GREATEST(COALESCE(EXCLUDED.workout_count, 0), COALESCE(s.workout_count, 0)),
      heart_rate_avg     = COALESCE(EXCLUDED.heart_rate_avg, s.heart_rate_avg),
      active_energy_kcal = COALESCE(EXCLUDED.active_energy_kcal, s.active_energy_kcal),
      computed_at        = now();

    d := d + 1;
  END LOOP;

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

-- One-off restore: push manually entered health_data back into the summary
-- wherever the summary value is missing or was zeroed out.
UPDATE public.wearable_daily_summary s
SET steps          = COALESCE(NULLIF(s.steps, 0), h.steps),
    sleep_minutes  = COALESCE(s.sleep_minutes, CASE WHEN h.sleep_hours IS NOT NULL THEN ROUND(h.sleep_hours * 60)::int END),
    resting_hr     = COALESCE(s.resting_hr, h.heart_rate_avg),
    heart_rate_avg = COALESCE(s.heart_rate_avg, h.heart_rate_avg),
    hrv_rmssd      = COALESCE(s.hrv_rmssd, h.hrv),
    computed_at    = now()
FROM public.health_data h
WHERE h.user_id = s.user_id AND h.date = s.summary_date;

INSERT INTO public.wearable_daily_summary (
  user_id, summary_date, steps, sleep_minutes, resting_hr, heart_rate_avg, hrv_rmssd, workout_count, computed_at
)
SELECT h.user_id, h.date, h.steps,
       CASE WHEN h.sleep_hours IS NOT NULL THEN ROUND(h.sleep_hours * 60)::int END,
       h.heart_rate_avg, h.heart_rate_avg, h.hrv, 0, now()
FROM public.health_data h
WHERE NOT EXISTS (
  SELECT 1 FROM public.wearable_daily_summary s
  WHERE s.user_id = h.user_id AND s.summary_date = h.date
);