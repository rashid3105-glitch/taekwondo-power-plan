
-- 1. coach_invites table
CREATE TABLE public.coach_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  uses_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_coach_invites_coach ON public.coach_invites(coach_id);
CREATE INDEX idx_coach_invites_code ON public.coach_invites(code) WHERE active = true;

ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own invites"
ON public.coach_invites FOR ALL
TO authenticated
USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Admins view all invites"
ON public.coach_invites FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- 2. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_invite_code text,
  ADD COLUMN IF NOT EXISTS pending_coach_id uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Public RPC: minimal lookup by code
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
  SELECT display_name INTO v_coach_name FROM public.profiles WHERE user_id = v_invite.coach_id;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_invite.code,
    'coach_id', v_invite.coach_id,
    'club_id', v_invite.club_id,
    'club_name', COALESCE(v_club_name, ''),
    'coach_name', COALESCE(v_coach_name, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_code(text) TO anon, authenticated;

-- 4. RPC: apply invite to current user (sets pending fields)
CREATE OR REPLACE FUNCTION public.apply_invite_to_my_profile(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.coach_invites;
  v_uid uuid := auth.uid();
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

  UPDATE public.profiles
  SET pending_invite_code = v_invite.code,
      pending_coach_id = v_invite.coach_id,
      rejection_reason = NULL,
      is_approved = false
  WHERE user_id = v_uid;

  RETURN jsonb_build_object('ok', true, 'club_id', v_invite.club_id, 'coach_id', v_invite.coach_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_invite_to_my_profile(text) TO authenticated;

-- 5. RPC: admin approves with invite (links to coach + club)
CREATE OR REPLACE FUNCTION public.admin_approve_with_invite(_athlete_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_coach uuid;
  v_pending_code text;
  v_club_id uuid;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;

  SELECT pending_coach_id, pending_invite_code
    INTO v_pending_coach, v_pending_code
  FROM public.profiles WHERE user_id = _athlete_id;

  IF v_pending_coach IS NOT NULL THEN
    SELECT club_id INTO v_club_id FROM public.coach_invites WHERE code = v_pending_code LIMIT 1;

    UPDATE public.profiles
    SET is_approved = true,
        club_id = COALESCE(v_club_id, club_id),
        pending_invite_code = NULL,
        pending_coach_id = NULL,
        rejection_reason = NULL
    WHERE user_id = _athlete_id;

    INSERT INTO public.coach_athletes (coach_id, athlete_id)
    VALUES (v_pending_coach, _athlete_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.coach_invites SET uses_count = uses_count + 1 WHERE code = v_pending_code;
  ELSE
    UPDATE public.profiles SET is_approved = true, rejection_reason = NULL WHERE user_id = _athlete_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_with_invite(uuid) TO authenticated;

-- 6. RPC: admin rejects with reason
CREATE OR REPLACE FUNCTION public.admin_reject_with_reason(_athlete_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;

  UPDATE public.profiles
  SET is_approved = false,
      rejection_reason = _reason
  WHERE user_id = _athlete_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_with_reason(uuid, text) TO authenticated;
