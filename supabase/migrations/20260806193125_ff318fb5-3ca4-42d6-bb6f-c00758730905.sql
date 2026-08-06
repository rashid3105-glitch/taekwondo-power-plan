CREATE OR REPLACE FUNCTION public.recompute_wearable_summary(_user_id uuid, _from date, _to date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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

    -- Steps: several devices (iPhone + Apple Watch) record the same activity.
    -- Summing them double counts, so take the highest single-source total.
    SELECT MAX(per_source)::int INTO v_steps
      FROM (
        SELECT SUM(value_numeric) AS per_source
          FROM public.wearable_samples
          WHERE user_id=_user_id AND metric_type='steps' AND start_at::date = d
          GROUP BY COALESCE(source_device, '')
      ) q;

    SELECT NULLIF(COUNT(*), 0)::int INTO v_workouts
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='workout' AND start_at::date = d;

    SELECT AVG(value_numeric) INTO v_hr
      FROM public.wearable_samples
      WHERE user_id=_user_id AND metric_type='heart_rate' AND start_at::date = d;

    -- Active energy: same multi-source double counting as steps.
    SELECT MAX(per_source) INTO v_energy
      FROM (
        SELECT SUM(value_numeric) AS per_source
          FROM public.wearable_samples
          WHERE user_id=_user_id AND metric_type='active_energy' AND start_at::date = d
          GROUP BY COALESCE(source_device, '')
      ) q;

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
           AVG(s2.hrv_rmssd) AS b_hrv
    FROM public.wearable_daily_summary s1
    JOIN public.wearable_daily_summary s2
      ON s2.user_id = s1.user_id
     AND s2.summary_date BETWEEN s1.summary_date - 6 AND s1.summary_date
    WHERE s1.user_id = _user_id
      AND s1.summary_date BETWEEN _from AND _to
    GROUP BY s1.summary_date
  ) sub
  WHERE tgt.user_id = _user_id AND tgt.summary_date = sub.summary_date;
END;
$function$;

-- One-off backfill: recompute steps and active energy per source device for
-- every day that already has samples, replacing the double-counted totals.
WITH per_source AS (
  SELECT user_id, start_at::date AS d, metric_type,
         COALESCE(source_device,'') AS src,
         SUM(value_numeric) AS total
  FROM public.wearable_samples
  WHERE metric_type IN ('steps','active_energy')
  GROUP BY 1,2,3,4
), best AS (
  SELECT user_id, d,
         MAX(total) FILTER (WHERE metric_type='steps')::int AS steps,
         MAX(total) FILTER (WHERE metric_type='active_energy') AS energy
  FROM per_source
  GROUP BY 1,2
)
UPDATE public.wearable_daily_summary s
SET steps = COALESCE(b.steps, s.steps),
    active_energy_kcal = COALESCE(b.energy, s.active_energy_kcal),
    computed_at = now()
FROM best b
WHERE s.user_id = b.user_id AND s.summary_date = b.d;