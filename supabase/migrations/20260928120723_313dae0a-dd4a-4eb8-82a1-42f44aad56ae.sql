-- 1. Audit table for birth date changes
CREATE TABLE public.birth_date_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  changed_by uuid,
  old_birth_date date,
  new_birth_date date,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.birth_date_audit TO authenticated;
GRANT ALL ON public.birth_date_audit TO service_role;
ALTER TABLE public.birth_date_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read birth date audit" ON public.birth_date_audit
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 2. Lock existing birth_date for everyone but service_role / platform admin
CREATE OR REPLACE FUNCTION public.lock_profile_birth_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.birth_date IS NOT DISTINCT FROM OLD.birth_date THEN
    RETURN NEW;
  END IF;
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW; -- edge functions enforce and audit the rule themselves
  END IF;
  IF OLD.birth_date IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'birth_date_locked' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.birth_date_audit(athlete_id, changed_by, old_birth_date, new_birth_date, source)
  VALUES (NEW.user_id, auth.uid(), OLD.birth_date, NEW.birth_date,
          CASE WHEN public.is_admin(auth.uid()) THEN 'admin_client' ELSE 'client' END);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_lock_profile_birth_date
  BEFORE UPDATE OF birth_date ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_profile_birth_date();

-- 3. Parents: no direct writes on consent_records; only via definer functions
DROP POLICY IF EXISTS "Linked parent updates consent" ON public.consent_records;
DROP POLICY IF EXISTS "Linked parent creates consent" ON public.consent_records;

CREATE OR REPLACE FUNCTION public.withdraw_consent_as_parent(_athlete uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _email text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_parent_of(auth.uid(), _athlete) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  UPDATE public.consent_records
     SET status = 'withdrawn', withdrawn_at = now(), grace_until = NULL,
         granted_by_relation = 'parent', granted_by_email = _email, updated_at = now()
   WHERE athlete_id = _athlete AND consent_type = 'health_data_processing';
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_consent_as_parent(_athlete uuid, _policy_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _email text; _club uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_parent_of(auth.uid(), _athlete) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _policy_version IS NULL OR length(_policy_version) > 40 THEN
    RAISE EXCEPTION 'invalid_policy_version';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  UPDATE public.consent_records
     SET status = 'granted', granted_at = now(), withdrawn_at = NULL, grace_until = NULL,
         granted_by_relation = 'parent', granted_by_email = _email,
         policy_version = _policy_version, updated_at = now()
   WHERE athlete_id = _athlete AND consent_type = 'health_data_processing';
  IF NOT FOUND THEN
    SELECT club_id INTO _club FROM public.profiles WHERE user_id = _athlete;
    INSERT INTO public.consent_records(athlete_id, consent_type, club_id, status, granted_at,
      granted_by_relation, granted_by_email, policy_version)
    VALUES (_athlete, 'health_data_processing', _club, 'granted', now(), 'parent', _email, _policy_version);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_consent_as_parent(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_consent_as_parent(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_consent_as_parent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_consent_as_parent(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.lock_profile_birth_date() FROM PUBLIC, anon, authenticated;