CREATE OR REPLACE FUNCTION public.admin_set_coach_role(_user_id uuid, _enable boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _roles text[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _enable THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'coach')
    ON CONFLICT (user_id, role) DO NOTHING;

    SELECT COALESCE(roles, ARRAY[]::text[]) INTO _roles FROM public.profiles WHERE user_id = _user_id;
    IF _roles IS NULL THEN _roles := ARRAY[]::text[]; END IF;
    IF NOT ('coach' = ANY(_roles)) THEN _roles := array_append(_roles, 'coach'); END IF;
    IF NOT ('athlete' = ANY(_roles)) THEN _roles := array_append(_roles, 'athlete'); END IF;

    UPDATE public.profiles
    SET role = 'coach', roles = _roles, active_role = 'coach'
    WHERE user_id = _user_id;

    UPDATE public.club_memberships
    SET role_in_club = 'coach'
    WHERE user_id = _user_id AND status = 'active' AND role_in_club = 'athlete';
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'coach';

    SELECT COALESCE(roles, ARRAY[]::text[]) INTO _roles FROM public.profiles WHERE user_id = _user_id;
    _roles := array_remove(COALESCE(_roles, ARRAY[]::text[]), 'coach');
    IF array_length(_roles, 1) IS NULL THEN _roles := ARRAY['athlete']::text[]; END IF;

    UPDATE public.profiles
    SET role = 'athlete', roles = _roles, active_role = 'athlete'
    WHERE user_id = _user_id;

    UPDATE public.club_memberships
    SET role_in_club = 'athlete'
    WHERE user_id = _user_id AND role_in_club = 'coach';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_coach_role(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_coach_role(uuid, boolean) TO authenticated;