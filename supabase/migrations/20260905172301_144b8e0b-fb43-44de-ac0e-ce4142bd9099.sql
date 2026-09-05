CREATE OR REPLACE FUNCTION public.get_invite_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.coach_invites;
  v_club_name text;
  v_coach_name text;
  v_coach_country text;
BEGIN
  SELECT * INTO v_invite FROM public.coach_invites
  WHERE code = upper(_code) AND active = true
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  SELECT name INTO v_club_name FROM public.clubs WHERE id = v_invite.club_id;
  SELECT display_name, country INTO v_coach_name, v_coach_country
    FROM public.profiles WHERE user_id = v_invite.coach_id;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_invite.code,
    'coach_id', v_invite.coach_id,
    'club_id', v_invite.club_id,
    'club_name', COALESCE(v_club_name, ''),
    'coach_name', COALESCE(v_coach_name, ''),
    'coach_country', v_coach_country
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _birth date := NULL;
  _invite_code text := NULLIF(NEW.raw_user_meta_data->>'invite_code','');
  _invite public.coach_invites;
  _country text := NULLIF(NEW.raw_user_meta_data->>'country','');
  _pending_coach uuid := NULL;
BEGIN
  BEGIN
    _birth := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date;
  EXCEPTION WHEN others THEN
    _birth := NULL;
  END;

  IF _invite_code IS NOT NULL THEN
    SELECT * INTO _invite FROM public.coach_invites
    WHERE code = upper(_invite_code) AND active = true AND expires_at > now()
    LIMIT 1;

    IF _invite.id IS NOT NULL THEN
      _pending_coach := _invite.coach_id;
      IF _country IS NULL THEN
        SELECT country INTO _country FROM public.profiles WHERE user_id = _invite.coach_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    user_id, display_name, is_demo, is_approved, birth_date, guardian_email,
    country, pending_coach_id, pending_invite_code
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'wants_demo')::boolean, false),
    false,
    _birth,
    NULLIF(NEW.raw_user_meta_data->>'guardian_email',''),
    _country,
    _pending_coach,
    CASE WHEN _pending_coach IS NOT NULL THEN upper(_invite_code) ELSE NULL END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

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
  v_coach_country text;
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

  SELECT country INTO v_coach_country FROM public.profiles WHERE user_id = v_invite.coach_id;

  UPDATE public.profiles
  SET is_approved = true,
      club_id = v_club,
      country = COALESCE(NULLIF(country, ''), v_coach_country),
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