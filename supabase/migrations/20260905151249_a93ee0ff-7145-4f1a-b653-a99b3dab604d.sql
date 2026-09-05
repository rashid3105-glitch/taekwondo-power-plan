CREATE OR REPLACE FUNCTION public.apply_invite_to_my_profile(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite public.coach_invites;
  v_uid uuid := auth.uid();
  v_club uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invite FROM public.coach_invites
  WHERE code = upper(_code) AND active = true AND expires_at > now()
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  v_club := v_invite.club_id;

  IF v_club IS NULL THEN
    SELECT club_id INTO v_club FROM public.profiles WHERE user_id = v_invite.coach_id;
  END IF;

  IF v_club IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_has_no_club');
  END IF;

  UPDATE public.profiles
  SET is_approved = true,
      club_id = v_club,
      pending_invite_code = NULL,
      pending_coach_id = NULL,
      rejection_reason = NULL
  WHERE user_id = v_uid;

  INSERT INTO public.coach_athletes (coach_id, athlete_id, club_id)
  VALUES (v_invite.coach_id, v_uid, v_club)
  ON CONFLICT DO NOTHING;

  UPDATE public.coach_invites SET uses_count = uses_count + 1 WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'club_id', v_club, 'coach_id', v_invite.coach_id, 'auto_approved', true);
END;
$function$;