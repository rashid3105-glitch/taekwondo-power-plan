ALTER TABLE public.consent_token_events ALTER COLUMN token_id DROP NOT NULL;
ALTER TABLE public.consent_records
  ADD COLUMN IF NOT EXISTS parent_link_needed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_email_missing boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.recompute_consent_requirement(_athlete uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _bd date; _club uuid; _pemail text; _age int; _ca int; _rec record; _t text := 'none';
BEGIN
  SELECT birth_date, club_id, coalesce(nullif(trim(parent_email),''), nullif(trim(guardian_email),''))
    INTO _bd, _club, _pemail FROM public.profiles WHERE user_id = _athlete;
  IF _bd IS NULL THEN RETURN 'none'; END IF;
  IF _pemail IS NULL THEN
    SELECT parent_email INTO _pemail FROM public.consent_tokens
     WHERE athlete_id = _athlete AND consent_type = 'health_data_processing'
       AND parent_email IS NOT NULL
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  SELECT * INTO _rec FROM public.consent_records
   WHERE athlete_id = _athlete AND consent_type = 'health_data_processing' LIMIT 1;
  IF NOT FOUND THEN RETURN 'none'; END IF;

  _age := date_part('year', age(_bd))::int;
  _ca := public.consent_age_for_athlete(_athlete);

  IF _age < _ca THEN
    IF _rec.status = 'pending' AND coalesce(_rec.granted_by_relation, 'self') = 'self' THEN
      _t := 'self_pending_to_parent';
      UPDATE public.consent_records
         SET granted_by_relation = 'parent', granted_by_email = NULL,
             parent_link_needed = true, parent_email_missing = (_pemail IS NULL), updated_at = now()
       WHERE id = _rec.id;
    ELSIF _rec.status = 'granted' AND _rec.granted_by_relation = 'self' THEN
      _t := 'self_granted_invalidated';
      UPDATE public.consent_records
         SET status = 'pending', granted_at = NULL, granted_by_relation = 'parent', granted_by_email = NULL,
             grace_until = NULL, parent_link_needed = true, parent_email_missing = (_pemail IS NULL),
             updated_at = now()
       WHERE id = _rec.id;
    END IF;
  ELSE
    IF _rec.status = 'pending' AND _rec.granted_by_relation = 'parent' THEN
      _t := 'parent_pending_to_self';
      UPDATE public.consent_records
         SET granted_by_relation = 'self', granted_by_email = NULL,
             parent_link_needed = false, parent_email_missing = false, updated_at = now()
       WHERE id = _rec.id;
    END IF;
  END IF;

  IF _t <> 'none' THEN
    INSERT INTO public.consent_token_events(token_id, athlete_id, club_id, event, meta)
    VALUES (NULL, _athlete, coalesce(_rec.club_id, _club), 'requirement_recomputed',
            jsonb_build_object('transition', _t, 'age', _age, 'consent_age', _ca));
  END IF;
  RETURN _t;
END;
$$;
REVOKE ALL ON FUNCTION public.recompute_consent_requirement(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_consent_requirement(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_recompute_consent_on_birth_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.birth_date IS DISTINCT FROM OLD.birth_date
     OR NEW.country IS DISTINCT FROM OLD.country THEN
    PERFORM public.recompute_consent_requirement(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_recompute_consent_on_birth_date() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_recompute_consent_on_birth_date
  AFTER INSERT OR UPDATE OF birth_date, country ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_consent_on_birth_date();

-- Parents may not consent on behalf of an athlete who can consent themselves.
CREATE OR REPLACE FUNCTION public.grant_consent_as_parent(_athlete uuid, _policy_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _email text; _club uuid; _bd date;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_parent_of(auth.uid(), _athlete) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _policy_version IS NULL OR length(_policy_version) > 40 THEN
    RAISE EXCEPTION 'invalid_policy_version';
  END IF;
  SELECT birth_date, club_id INTO _bd, _club FROM public.profiles WHERE user_id = _athlete;
  IF _bd IS NOT NULL AND date_part('year', age(_bd)) >= public.consent_age_for_athlete(_athlete) THEN
    RAISE EXCEPTION 'athlete_can_self_consent' USING ERRCODE = '42501';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  UPDATE public.consent_records
     SET status = 'granted', granted_at = now(), withdrawn_at = NULL, grace_until = NULL,
         granted_by_relation = 'parent', granted_by_email = _email, policy_version = _policy_version,
         parent_link_needed = false, parent_email_missing = false, updated_at = now()
   WHERE athlete_id = _athlete AND consent_type = 'health_data_processing';
  IF NOT FOUND THEN
    INSERT INTO public.consent_records(athlete_id, consent_type, club_id, status, granted_at,
      granted_by_relation, granted_by_email, policy_version)
    VALUES (_athlete, 'health_data_processing', _club, 'granted', now(), 'parent', _email, _policy_version);
  END IF;
END;
$$;