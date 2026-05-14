
CREATE TABLE public.parent_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes manage own parent invites"
  ON public.parent_invites FOR ALL
  TO authenticated
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Parents read own invite"
  ON public.parent_invites FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid());

CREATE TABLE public.parent_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, athlete_id)
);
ALTER TABLE public.parent_athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents read own links"
  ON public.parent_athletes FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid() OR athlete_id = auth.uid());
CREATE POLICY "Athletes can remove parent link"
  ON public.parent_athletes FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid() OR parent_user_id = auth.uid());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_parent boolean NOT NULL DEFAULT false;

-- Helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_parent_of(_parent uuid, _athlete uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.parent_athletes
                 WHERE parent_user_id = _parent AND athlete_id = _athlete)
$$;

CREATE POLICY "Parents read linked athlete plans"
  ON public.training_plans FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents read linked athlete competitions"
  ON public.competitions FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents read linked athlete workout logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents read linked athlete profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE OR REPLACE FUNCTION public.accept_parent_invite(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite public.parent_invites;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_invite FROM public.parent_invites
  WHERE code = _code AND used_at IS NULL AND expires_at > now();

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired'); END IF;
  IF v_invite.athlete_id = v_user_id THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_link_self'); END IF;

  UPDATE public.parent_invites SET used_at = now(), parent_user_id = v_user_id WHERE id = v_invite.id;

  INSERT INTO public.parent_athletes (parent_user_id, athlete_id)
  VALUES (v_user_id, v_invite.athlete_id)
  ON CONFLICT (parent_user_id, athlete_id) DO NOTHING;

  UPDATE public.profiles SET is_parent = true WHERE user_id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'athlete_id', v_invite.athlete_id);
END $$;
GRANT EXECUTE ON FUNCTION public.accept_parent_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_parent_invite_info(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite public.parent_invites; v_profile public.profiles;
BEGIN
  SELECT * INTO v_invite FROM public.parent_invites
  WHERE code = _code AND used_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false); END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_invite.athlete_id;
  RETURN jsonb_build_object('valid', true, 'athlete_name', v_profile.display_name, 'athlete_belt', v_profile.belt_level);
END $$;
GRANT EXECUTE ON FUNCTION public.get_parent_invite_info(text) TO anon, authenticated;
