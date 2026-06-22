
-- 1) Column on profiles to track active superadmin mode
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS superadmin_active boolean NOT NULL DEFAULT false;

-- 2) Security-definer helper
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
     AND EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.user_id = _user_id AND p.superadmin_active = true)
$$;

-- 3) RPC to flip the toggle (admin only, own row)
CREATE OR REPLACE FUNCTION public.set_superadmin_active(_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE public.profiles SET superadmin_active = _active WHERE user_id = auth.uid();
  RETURN _active;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_superadmin_active(boolean) TO authenticated;

-- 4) Helper to add a "Superadmin read all" policy idempotently
DO $do$
DECLARE
  t text;
  tables text[] := ARRAY[
    'club_season_plans','club_season_phases','club_season_day_templates','club_athlete_season_overrides',
    'season_plans',
    'club_techniques','club_week_technique_focus','athlete_week_technique_focus',
    'club_module_defaults','athlete_module_overrides',
    'training_plans','rehab_plans','nutrition_plans','nutrition_logs',
    'workout_logs','workout_log_feedback',
    'diary_entries','diary_comments',
    'readiness_checkins','mental_assessments','competition_reflections','competition_reflection_requests',
    'physical_test_results',
    'competitions',
    'form_curve_weekly',
    'coach_athletes','club_memberships','coach_athlete_notes',
    'session_attendance','weight_logs','supplement_checks',
    'health_data','wearable_daily_summary','wearable_samples',
    'athlete_achievements','athlete_highlight_videos','user_exercises','user_recipes',
    'event_reminders','coach_messages',
    'survey_responses','survey_answers','surveys','survey_questions','survey_recipients','survey_templates',
    'parent_athletes',
    'rehab_plans','match_videos','match_tags','video_notes','video_annotations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Superadmin read all" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Superadmin read all" ON public.%I FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()))',
      t
    );
  END LOOP;
END
$do$;
