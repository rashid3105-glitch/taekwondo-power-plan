
ALTER TABLE public.wearable_daily_summary
  ADD COLUMN IF NOT EXISTS heart_rate_avg numeric,
  ADD COLUMN IF NOT EXISTS active_energy_kcal numeric;

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
      user_id, summary_date, sleep_minutes, resting_hr, hrv_rmssd, steps,
      workout_count, heart_rate_avg, active_energy_kcal, computed_at
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
      (SELECT AVG(value_numeric) FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='heart_rate'
          AND start_at::date = d),
      (SELECT COALESCE(SUM(value_numeric),0) FROM public.wearable_samples
        WHERE user_id=_user_id AND metric_type='active_energy'
          AND start_at::date = d),
      now()
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
      sleep_minutes      = EXCLUDED.sleep_minutes,
      resting_hr         = EXCLUDED.resting_hr,
      hrv_rmssd          = EXCLUDED.hrv_rmssd,
      steps              = EXCLUDED.steps,
      workout_count      = EXCLUDED.workout_count,
      heart_rate_avg     = EXCLUDED.heart_rate_avg,
      active_energy_kcal = EXCLUDED.active_energy_kcal,
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
