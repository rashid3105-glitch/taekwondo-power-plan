
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS deactivated_by uuid;

COMMENT ON COLUMN public.clubs.deleted_at IS 'Set when the club is deactivated (paused). Reactivation is possible; permanent deletion is a separate admin action.';
COMMENT ON COLUMN public.clubs.deactivated_by IS 'Platform admin user id that deactivated the club.';

CREATE OR REPLACE FUNCTION public.admin_deactivate_club(_club_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _members int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT count(*) INTO _members FROM public.club_memberships
   WHERE club_id = _club_id AND status = 'active';

  UPDATE public.clubs
     SET deleted_at = COALESCE(deleted_at, now()),
         deactivated_by = auth.uid(),
         license_active = false
   WHERE id = _club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'club_not_found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'active_members', _members);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_club(_club_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.clubs
     SET deleted_at = NULL,
         deactivated_by = NULL
   WHERE id = _club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'club_not_found';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_club(_club_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deactivated timestamptz;
  _members int;
  _profiles int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT deleted_at INTO _deactivated FROM public.clubs WHERE id = _club_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'club_not_found';
  END IF;
  IF _deactivated IS NULL THEN
    RAISE EXCEPTION 'club_not_deactivated';
  END IF;

  SELECT count(*) INTO _members FROM public.club_memberships
   WHERE club_id = _club_id AND status = 'active';
  SELECT count(*) INTO _profiles FROM public.profiles WHERE club_id = _club_id;

  IF _members > 0 OR _profiles > 0 THEN
    RAISE EXCEPTION 'club_not_empty: % active members, % profiles', _members, _profiles;
  END IF;

  -- Children first (tables whose club_id FK is NO ACTION, plus club-scoped
  -- tables with no FK at all). Everything else cascades from clubs.
  DELETE FROM public.workout_log_feedback WHERE club_id = _club_id;
  DELETE FROM public.workout_logs WHERE club_id = _club_id;
  DELETE FROM public.diary_comments WHERE club_id = _club_id;
  DELETE FROM public.diary_entries WHERE club_id = _club_id;
  DELETE FROM public.coach_reflection_comments WHERE club_id = _club_id;
  DELETE FROM public.competition_reflections WHERE club_id = _club_id;
  DELETE FROM public.competition_reflection_requests WHERE club_id = _club_id;
  DELETE FROM public.competitions WHERE club_id = _club_id;
  DELETE FROM public.athlete_week_technique_focus WHERE club_id = _club_id;
  DELETE FROM public.athlete_module_overrides WHERE club_id = _club_id;
  DELETE FROM public.athlete_modules WHERE club_id = _club_id;
  DELETE FROM public.athlete_training_status WHERE club_id = _club_id;
  DELETE FROM public.coach_athlete_notes WHERE club_id = _club_id;
  DELETE FROM public.coach_messages WHERE club_id = _club_id;
  DELETE FROM public.event_reminders WHERE club_id = _club_id;
  DELETE FROM public.form_curve_weekly WHERE club_id = _club_id;
  DELETE FROM public.health_data WHERE club_id = _club_id;
  DELETE FROM public.mental_assessments WHERE club_id = _club_id;
  DELETE FROM public.nutrition_plans WHERE club_id = _club_id;
  DELETE FROM public.physical_test_results WHERE club_id = _club_id;
  DELETE FROM public.readiness_checkins WHERE club_id = _club_id;
  DELETE FROM public.rehab_plans WHERE club_id = _club_id;
  DELETE FROM public.season_plans WHERE club_id = _club_id;
  DELETE FROM public.session_attendance WHERE club_id = _club_id;
  DELETE FROM public.supplement_checks WHERE club_id = _club_id;
  DELETE FROM public.training_plans WHERE club_id = _club_id;
  DELETE FROM public.wearable_daily_summary WHERE club_id = _club_id;
  DELETE FROM public.wearable_connections WHERE club_id = _club_id;
  DELETE FROM public.weight_logs WHERE club_id = _club_id;
  DELETE FROM public.match_videos WHERE club_id = _club_id;
  DELETE FROM public.running_program_enrollments WHERE club_id = _club_id;
  DELETE FROM public.surveys WHERE club_id = _club_id;
  DELETE FROM public.survey_templates WHERE club_id = _club_id;
  DELETE FROM public.compliance_alerts WHERE club_id = _club_id;
  DELETE FROM public.consent_token_events WHERE club_id = _club_id;
  DELETE FROM public.consent_records WHERE club_id = _club_id;
  DELETE FROM public.chat_threads WHERE club_id = _club_id;

  DELETE FROM public.clubs WHERE id = _club_id;

  RETURN jsonb_build_object('ok', true, 'club_id', _club_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_deactivate_club(uuid) FROM public;
REVOKE ALL ON FUNCTION public.admin_reactivate_club(uuid) FROM public;
REVOKE ALL ON FUNCTION public.admin_delete_club(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_club(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_club(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_club(uuid) TO authenticated;
