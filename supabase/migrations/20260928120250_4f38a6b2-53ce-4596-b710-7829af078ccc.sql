CREATE OR REPLACE FUNCTION public.get_athlete_recovery_trend(_athlete_id uuid, _days integer DEFAULT 7)
 RETURNS TABLE(summary_date date, sleep_minutes integer, resting_hr numeric, hrv_rmssd numeric, steps integer, baseline_hr_7d numeric, baseline_hrv_7d numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT s.summary_date, s.sleep_minutes, s.resting_hr, s.hrv_rmssd,
         s.steps, s.baseline_hr_7d, s.baseline_hrv_7d
  FROM public.wearable_daily_summary s
  WHERE s.user_id = _athlete_id
    AND s.summary_date >= (CURRENT_DATE - GREATEST(_days, 1))
    AND (
      auth.uid() = _athlete_id
      OR (public.is_coach_of_athletes_club(_athlete_id)
          AND COALESCE(public.has_health_consent(_athlete_id), false))
    )
  ORDER BY s.summary_date ASC
$function$;

CREATE OR REPLACE FUNCTION public.get_squad_overview(_coach_id uuid, _club_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH guard AS (
    SELECT (auth.uid() IS NOT NULL AND auth.uid() = _coach_id AND has_role(_coach_id, 'coach'::app_role)) AS ok
  ),
  athletes AS (
    SELECT ca.athlete_id AS user_id
    FROM public.coach_athletes ca, guard
    WHERE guard.ok AND ca.coach_id = _coach_id AND (_club_id IS NULL OR ca.club_id = _club_id)
    UNION
    SELECT m2.user_id
    FROM public.club_memberships m1
    JOIN public.club_memberships m2 ON m1.club_id = m2.club_id, guard
    WHERE guard.ok AND m1.user_id = _coach_id AND m1.status = 'active' AND m2.status = 'active'
      AND m2.user_id <> _coach_id AND (_club_id IS NULL OR m1.club_id = _club_id)
  ),
  consent AS (
    SELECT user_id, COALESCE(public.has_health_consent(user_id), false) AS ok FROM athletes
  ),
  latest_readiness AS (
    SELECT DISTINCT ON (r.user_id) r.user_id, r.score, r.checkin_date FROM public.readiness_checkins r
    JOIN consent c ON c.user_id = r.user_id AND c.ok
    ORDER BY r.user_id, r.checkin_date DESC, r.created_at DESC
  ),
  latest_mood AS (
    SELECT DISTINCT ON (d.user_id) d.user_id, d.mood, d.energy, d.entry_date FROM public.diary_entries d
    JOIN consent c ON c.user_id = d.user_id AND c.ok
    WHERE COALESCE(d.is_private, false) = false
    ORDER BY d.user_id, d.entry_date DESC, d.created_at DESC
  ),
  sessions_7d AS (
    SELECT user_id, COUNT(DISTINCT logged_date) AS sessions_logged FROM public.workout_logs
    WHERE user_id IN (SELECT user_id FROM athletes) AND completed = true
      AND logged_date >= (CURRENT_DATE - 7) GROUP BY user_id
  ),
  active_plan AS (
    SELECT DISTINCT user_id FROM public.training_plans
    WHERE is_active = true AND user_id IN (SELECT user_id FROM athletes)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', p.user_id, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'belt_level', p.belt_level, 'athlete_code', p.athlete_code,
    'sessions_per_week', p.sessions_per_week, 'last_seen_at', p.last_seen_at,
    'consent_missing', NOT c.ok,
    'has_active_injury', CASE WHEN c.ok THEN (p.current_injury IS NOT NULL AND length(trim(p.current_injury)) > 0) ELSE NULL END,
    'has_active_plan', (ap.user_id IS NOT NULL),
    'latest_readiness_score', lr.score, 'latest_readiness_date', lr.checkin_date,
    'latest_mood', lm.mood, 'latest_energy', lm.energy, 'latest_diary_date', lm.entry_date,
    'sessions_logged_7d', COALESCE(s7.sessions_logged, 0),
    'planned_sessions_7d', p.sessions_per_week
  ) ORDER BY p.display_name), '[]'::jsonb)
  FROM athletes a
  JOIN consent c ON c.user_id = a.user_id
  JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN latest_readiness lr ON lr.user_id = p.user_id
  LEFT JOIN latest_mood lm ON lm.user_id = p.user_id
  LEFT JOIN sessions_7d s7 ON s7.user_id = p.user_id
  LEFT JOIN active_plan ap ON ap.user_id = p.user_id
$function$;

-- compute_form_curve writes coach-readable strain derived from readiness + diary.
-- Exclude private diary entries and health inputs when consent is missing.
CREATE OR REPLACE FUNCTION public.compute_form_curve(_user_id uuid, _weeks integer DEFAULT 12)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_week_start DATE; v_load NUMERIC; v_strain NUMERIC; v_output NUMERIC; v_composite NUMERIC;
  v_prev_load NUMERIC := 0; v_prev_strain NUMERIC := 0; v_overtraining BOOLEAN;
  v_consecutive_high INT := 0; v_club_id UUID; v_consent BOOLEAN;
BEGIN
  SELECT club_id INTO v_club_id FROM public.profiles WHERE user_id = _user_id;
  IF v_club_id IS NULL THEN
    SELECT club_id INTO v_club_id FROM public.club_memberships
    WHERE user_id = _user_id AND status = 'active' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_club_id IS NULL THEN RETURN; END IF;

  v_consent := COALESCE(public.has_health_consent(_user_id), false);

  FOR i IN REVERSE (_weeks - 1)..0 LOOP
    v_week_start := date_trunc('week', (now() - (i || ' weeks')::interval))::date;

    SELECT COALESCE(COUNT(*) * 30, 0)::numeric INTO v_load FROM public.workout_logs
    WHERE user_id = _user_id AND completed = true
      AND logged_date >= v_week_start AND logged_date < v_week_start + INTERVAL '7 days';

    IF v_consent THEN
      SELECT COALESCE(
        (SELECT AVG(10 - score) FROM public.readiness_checkins
          WHERE user_id = _user_id AND checkin_date >= v_week_start
          AND checkin_date < v_week_start + INTERVAL '7 days'), 0
      ) + COALESCE(
        (SELECT AVG((5 - mood) + (5 - energy)) FROM public.diary_entries
          WHERE user_id = _user_id AND COALESCE(is_private, false) = false
          AND entry_date >= v_week_start AND entry_date < v_week_start + INTERVAL '7 days'), 0
      ) INTO v_strain;
    ELSE
      v_strain := 0;
    END IF;

    SELECT COALESCE(COUNT(*) * 10, 0)::numeric INTO v_output FROM public.physical_test_results
    WHERE user_id = _user_id AND test_date >= v_week_start AND test_date < v_week_start + INTERVAL '7 days';

    v_composite := LEAST(100, GREATEST(0, (v_load * 0.5) + (v_output * 1.5) - (v_strain * 2.0) + 50));

    IF v_load > v_prev_load * 1.2 AND v_strain > v_prev_strain * 1.2 AND v_strain > 5 THEN
      v_consecutive_high := v_consecutive_high + 1;
    ELSE
      v_consecutive_high := 0;
    END IF;
    v_overtraining := v_consecutive_high >= 2;

    INSERT INTO public.form_curve_weekly (user_id, week_start, load, strain, output, composite_score, overtraining_flag, computed_at, club_id)
    VALUES (_user_id, v_week_start, v_load, v_strain, v_output, v_composite, v_overtraining, now(), v_club_id)
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      load = EXCLUDED.load, strain = EXCLUDED.strain, output = EXCLUDED.output,
      composite_score = EXCLUDED.composite_score, overtraining_flag = EXCLUDED.overtraining_flag,
      computed_at = now(), club_id = COALESCE(EXCLUDED.club_id, public.form_curve_weekly.club_id);

    v_prev_load := v_load; v_prev_strain := v_strain;
  END LOOP;
END;
$function$;