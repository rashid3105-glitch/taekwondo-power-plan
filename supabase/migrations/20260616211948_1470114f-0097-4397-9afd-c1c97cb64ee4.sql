
-- 1) users_share_club: bruger club_memberships i stedet for profiles.club_id
CREATE OR REPLACE FUNCTION public.users_share_club(_first_user_id uuid, _second_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships m1
    JOIN public.club_memberships m2 ON m1.club_id = m2.club_id
    WHERE m1.user_id = _first_user_id
      AND m2.user_id = _second_user_id
      AND m1.status = 'active'
      AND m2.status = 'active'
  )
$$;

-- 2) can_chat_with: coach_athletes-grenen kræver aktivt fælles klubmedlemskab
CREATE OR REPLACE FUNCTION public.can_chat_with(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _a <> _b AND (
    EXISTS (
      SELECT 1
      FROM public.coach_athletes ca
      JOIN public.club_memberships m1
        ON m1.user_id = ca.coach_id AND m1.club_id = ca.club_id AND m1.status = 'active'
      JOIN public.club_memberships m2
        ON m2.user_id = ca.athlete_id AND m2.club_id = ca.club_id AND m2.status = 'active'
      WHERE ca.club_id IS NOT NULL
        AND ((ca.coach_id = _a AND ca.athlete_id = _b)
          OR (ca.coach_id = _b AND ca.athlete_id = _a))
    )
    OR public.users_share_club(_a, _b)
  )
$$;

-- 3) get_squad_overview: tilføj valgfri _club_id parameter (default NULL = alle klubber, bagudkompatibel)
DROP FUNCTION IF EXISTS public.get_squad_overview(uuid);

CREATE OR REPLACE FUNCTION public.get_squad_overview(_coach_id uuid, _club_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH guard AS (
    SELECT (auth.uid() IS NOT NULL AND auth.uid() = _coach_id AND has_role(_coach_id, 'coach'::app_role)) AS ok
  ),
  athletes AS (
    SELECT ca.athlete_id AS user_id
    FROM public.coach_athletes ca, guard
    WHERE guard.ok
      AND ca.coach_id = _coach_id
      AND (_club_id IS NULL OR ca.club_id = _club_id)
    UNION
    SELECT m2.user_id
    FROM public.club_memberships m1
    JOIN public.club_memberships m2 ON m1.club_id = m2.club_id, guard
    WHERE guard.ok
      AND m1.user_id = _coach_id
      AND m1.status = 'active'
      AND m2.status = 'active'
      AND m2.user_id <> _coach_id
      AND (_club_id IS NULL OR m1.club_id = _club_id)
  ),
  latest_readiness AS (
    SELECT DISTINCT ON (user_id) user_id, score, checkin_date FROM public.readiness_checkins
    WHERE user_id IN (SELECT user_id FROM athletes) ORDER BY user_id, checkin_date DESC, created_at DESC
  ),
  latest_mood AS (
    SELECT DISTINCT ON (user_id) user_id, mood, energy, entry_date FROM public.diary_entries
    WHERE user_id IN (SELECT user_id FROM athletes) ORDER BY user_id, entry_date DESC, created_at DESC
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
    'tkd_sessions_per_week', p.tkd_sessions_per_week, 'last_seen_at', p.last_seen_at,
    'has_active_injury', (p.current_injury IS NOT NULL AND length(trim(p.current_injury)) > 0),
    'has_active_plan', (ap.user_id IS NOT NULL),
    'latest_readiness_score', lr.score, 'latest_readiness_date', lr.checkin_date,
    'latest_mood', lm.mood, 'latest_energy', lm.energy, 'latest_diary_date', lm.entry_date,
    'sessions_logged_7d', COALESCE(s7.sessions_logged, 0),
    'planned_sessions_7d', p.tkd_sessions_per_week
  ) ORDER BY p.display_name), '[]'::jsonb)
  FROM athletes a
  JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN latest_readiness lr ON lr.user_id = p.user_id
  LEFT JOIN latest_mood lm ON lm.user_id = p.user_id
  LEFT JOIN sessions_7d s7 ON s7.user_id = p.user_id
  LEFT JOIN active_plan ap ON ap.user_id = p.user_id
$$;

-- 4) get_athlete_recovery_trend: stram guard til is_coach_of_athletes_club (kræver aktivt fælles klubmedlemskab)
CREATE OR REPLACE FUNCTION public.get_athlete_recovery_trend(_athlete_id uuid, _days integer DEFAULT 7)
RETURNS TABLE(summary_date date, sleep_minutes integer, resting_hr numeric, hrv_rmssd numeric, steps integer, baseline_hr_7d numeric, baseline_hrv_7d numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.summary_date, s.sleep_minutes, s.resting_hr, s.hrv_rmssd,
         s.steps, s.baseline_hr_7d, s.baseline_hrv_7d
  FROM public.wearable_daily_summary s
  WHERE s.user_id = _athlete_id
    AND s.summary_date >= (CURRENT_DATE - GREATEST(_days, 1))
    AND (
      auth.uid() = _athlete_id
      OR public.is_coach_of_athletes_club(_athlete_id)
    )
  ORDER BY s.summary_date ASC
$$;

-- 5) get_club_test_medians: stram guard tilsvarende
CREATE OR REPLACE FUNCTION public.get_club_test_medians(_athlete_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH guard AS (
    SELECT public.is_coach_of_athletes_club(_athlete_id) AS ok
  ),
  target AS (
    SELECT p.club_id FROM public.profiles p, guard WHERE guard.ok AND p.user_id = _athlete_id
  ),
  club_members AS (
    SELECT p.user_id FROM public.profiles p, target WHERE p.club_id = target.club_id AND target.club_id IS NOT NULL
  ),
  best_per_test AS (
    SELECT DISTINCT ON (user_id, test_name) user_id, test_name, category, unit, value
    FROM public.physical_test_results
    WHERE user_id IN (SELECT user_id FROM club_members)
    ORDER BY user_id, test_name, value DESC
  ),
  athlete_best AS (
    SELECT test_name, value AS athlete_value FROM best_per_test WHERE user_id = _athlete_id
  ),
  medians AS (
    SELECT test_name, category, unit,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY value) AS median_value,
      COUNT(*) AS sample_size
    FROM best_per_test GROUP BY test_name, category, unit
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'test_name', m.test_name, 'category', m.category, 'unit', m.unit,
    'athlete_value', ab.athlete_value, 'club_median', m.median_value,
    'sample_size', m.sample_size
  ) ORDER BY m.category, m.test_name), '[]'::jsonb)
  FROM medians m
  LEFT JOIN athlete_best ab ON ab.test_name = m.test_name
  WHERE ab.athlete_value IS NOT NULL
$$;
