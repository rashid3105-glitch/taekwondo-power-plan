
CREATE OR REPLACE FUNCTION public.compute_form_curve(_user_id UUID, _weeks INTEGER DEFAULT 12)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_load NUMERIC;
  v_strain NUMERIC;
  v_output NUMERIC;
  v_composite NUMERIC;
  v_prev_load NUMERIC := 0;
  v_prev_strain NUMERIC := 0;
  v_overtraining BOOLEAN;
  v_consecutive_high INT := 0;
  v_club_id UUID;
BEGIN
  -- Resolve the athlete's club once so every weekly row is stamped.
  SELECT club_id INTO v_club_id FROM public.profiles WHERE user_id = _user_id;

  FOR i IN REVERSE (_weeks - 1)..0 LOOP
    v_week_start := date_trunc('week', (now() - (i || ' weeks')::interval))::date;

    SELECT COALESCE(COUNT(*) * 30, 0)::numeric INTO v_load
    FROM public.workout_logs
    WHERE user_id = _user_id
      AND completed = true
      AND logged_date >= v_week_start
      AND logged_date < v_week_start + INTERVAL '7 days';

    SELECT COALESCE(
      (SELECT AVG(10 - score) FROM public.readiness_checkins
        WHERE user_id = _user_id
        AND checkin_date >= v_week_start
        AND checkin_date < v_week_start + INTERVAL '7 days'),
      0
    ) + COALESCE(
      (SELECT AVG((5 - mood) + (5 - energy)) FROM public.diary_entries
        WHERE user_id = _user_id
        AND entry_date >= v_week_start
        AND entry_date < v_week_start + INTERVAL '7 days'),
      0
    ) INTO v_strain;

    SELECT COALESCE(COUNT(*) * 10, 0)::numeric INTO v_output
    FROM public.physical_test_results
    WHERE user_id = _user_id
      AND test_date >= v_week_start
      AND test_date < v_week_start + INTERVAL '7 days';

    v_composite := LEAST(100, GREATEST(0,
      (v_load * 0.5) + (v_output * 1.5) - (v_strain * 2.0) + 50
    ));

    IF v_load > v_prev_load * 1.2 AND v_strain > v_prev_strain * 1.2 AND v_strain > 5 THEN
      v_consecutive_high := v_consecutive_high + 1;
    ELSE
      v_consecutive_high := 0;
    END IF;
    v_overtraining := v_consecutive_high >= 2;

    INSERT INTO public.form_curve_weekly (
      user_id, week_start, load, strain, output, composite_score, overtraining_flag, computed_at, club_id
    ) VALUES (
      _user_id, v_week_start, v_load, v_strain, v_output, v_composite, v_overtraining, now(), v_club_id
    )
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      load = EXCLUDED.load,
      strain = EXCLUDED.strain,
      output = EXCLUDED.output,
      composite_score = EXCLUDED.composite_score,
      overtraining_flag = EXCLUDED.overtraining_flag,
      computed_at = now(),
      club_id = COALESCE(EXCLUDED.club_id, public.form_curve_weekly.club_id);

    v_prev_load := v_load;
    v_prev_strain := v_strain;
  END LOOP;
END;
$$;
