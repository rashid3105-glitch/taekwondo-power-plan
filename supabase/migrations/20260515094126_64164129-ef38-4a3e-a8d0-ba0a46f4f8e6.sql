CREATE OR REPLACE FUNCTION public.accept_parent_invite(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite public.parent_invites; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT * INTO v_invite FROM public.parent_invites
    WHERE code = _code AND used_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired'); END IF;
  IF v_invite.athlete_id = v_uid THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_link_self'); END IF;
  UPDATE public.parent_invites SET used_at = now(), parent_user_id = v_uid WHERE id = v_invite.id;
  INSERT INTO public.parent_athletes (parent_user_id, athlete_id) VALUES (v_uid, v_invite.athlete_id) ON CONFLICT DO NOTHING;
  UPDATE public.profiles
    SET is_parent = true, is_approved = true, onboarding_completed = true
    WHERE user_id = v_uid;
  RETURN jsonb_build_object('ok', true, 'athlete_id', v_invite.athlete_id);
END $$;