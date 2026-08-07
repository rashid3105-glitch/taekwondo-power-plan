ALTER TABLE public.profiles RENAME COLUMN tkd_sessions_per_week TO sessions_per_week;
ALTER TABLE public.profiles RENAME COLUMN tkd_start_date TO sport_start_date;

DROP FUNCTION IF EXISTS public.get_club_member_profiles(uuid);
CREATE OR REPLACE FUNCTION public.get_club_member_profiles(_club_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, athlete_code text, age integer, weight_kg numeric, belt_level text, experience_years integer, goals text[], sessions_per_week integer, current_injury text, program_weeks integer, weekly_schedule jsonb, avatar_url text, discipline text, club_id uuid, country text, is_coach boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.user_id, p.display_name, p.athlete_code, p.age, p.weight_kg,
    p.belt_level, p.experience_years, p.goals, p.sessions_per_week,
    p.current_injury, p.program_weeks, p.weekly_schedule, p.avatar_url,
    p.discipline, _club_id AS club_id, p.country,
    public.has_role(p.user_id, 'coach'::app_role) AS is_coach
  FROM public.profiles p
  WHERE (
      public.is_coach_of_club(_club_id)
      OR public.is_admin(auth.uid())
      OR public.is_superadmin(auth.uid())
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.club_memberships m
        WHERE m.user_id = p.user_id AND m.club_id = _club_id AND m.status = 'active'
      )
      OR p.club_id = _club_id
    )
$function$;

CREATE OR REPLACE FUNCTION public.get_squad_overview(_coach_id uuid, _club_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'sessions_per_week', p.sessions_per_week, 'last_seen_at', p.last_seen_at,
    'has_active_injury', (p.current_injury IS NOT NULL AND length(trim(p.current_injury)) > 0),
    'has_active_plan', (ap.user_id IS NOT NULL),
    'latest_readiness_score', lr.score, 'latest_readiness_date', lr.checkin_date,
    'latest_mood', lm.mood, 'latest_energy', lm.energy, 'latest_diary_date', lm.entry_date,
    'sessions_logged_7d', COALESCE(s7.sessions_logged, 0),
    'planned_sessions_7d', p.sessions_per_week
  ) ORDER BY p.display_name), '[]'::jsonb)
  FROM athletes a
  JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN latest_readiness lr ON lr.user_id = p.user_id
  LEFT JOIN latest_mood lm ON lm.user_id = p.user_id
  LEFT JOIN sessions_7d s7 ON s7.user_id = p.user_id
  LEFT JOIN active_plan ap ON ap.user_id = p.user_id
$function$;