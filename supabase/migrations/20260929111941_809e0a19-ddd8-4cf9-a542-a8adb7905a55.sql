ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS needs_self_confirmation boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.consent_withdrawal_effects()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.consent_type <> 'health_data_processing' THEN RETURN NEW; END IF;
  -- Self-confirmation only applies to an active parent grant.
  IF NEW.status <> 'granted' OR coalesce(NEW.granted_by_relation,'') <> 'parent' THEN
    NEW.needs_self_confirmation := false;
  END IF;
  IF NEW.status = 'withdrawn' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'withdrawn') THEN
    NEW.withdrawn_at := COALESCE(NEW.withdrawn_at, now());
    NEW.health_data_delete_after := NEW.withdrawn_at + interval '30 days';
    NEW.health_data_purged_at := NULL;
    UPDATE public.wearable_connections SET status = 'revoked', updated_at = now()
     WHERE user_id = NEW.athlete_id AND status <> 'revoked';
  ELSIF NEW.status = 'granted' THEN
    NEW.health_data_delete_after := NULL;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.recompute_consent_requirement(_athlete uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _bd date; _club uuid; _pemail text; _age int; _ca int; _rec record; _t text := 'none'; _created boolean := false;
BEGIN
  SELECT birth_date, club_id, coalesce(nullif(trim(parent_email),''), nullif(trim(guardian_email),''))
    INTO _bd, _club, _pemail FROM public.profiles WHERE user_id = _athlete;
  IF NOT FOUND THEN RETURN 'none'; END IF;
  IF _pemail IS NULL THEN
    SELECT parent_email INTO _pemail FROM public.consent_tokens
     WHERE athlete_id = _athlete AND consent_type = 'health_data_processing' AND parent_email IS NOT NULL
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  SELECT * INTO _rec FROM public.consent_records
   WHERE athlete_id = _athlete AND consent_type = 'health_data_processing' LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.consent_records(athlete_id, consent_type, status, granted_by_relation, club_id)
    VALUES (_athlete, 'health_data_processing', 'pending', 'self', _club)
    RETURNING * INTO _rec;
    _created := true;
    INSERT INTO public.consent_token_events(token_id, athlete_id, club_id, event, meta)
    VALUES (NULL, _athlete, _club, 'requirement_recomputed', jsonb_build_object('transition','record_created'));
  END IF;

  IF _bd IS NULL THEN RETURN CASE WHEN _created THEN 'created' ELSE 'none' END; END IF;

  _age := date_part('year', age(_bd))::int;
  _ca := public.consent_age_for_athlete(_athlete);

  IF _age < _ca THEN
    IF _rec.status = 'pending' AND coalesce(_rec.granted_by_relation, 'self') = 'self' THEN
      _t := 'self_pending_to_parent';
      UPDATE public.consent_records SET granted_by_relation = 'parent', granted_by_email = NULL,
             parent_link_needed = true, parent_email_missing = (_pemail IS NULL), updated_at = now()
       WHERE id = _rec.id;
    ELSIF _rec.status = 'granted' AND _rec.granted_by_relation = 'self' THEN
      _t := 'self_granted_invalidated';
      UPDATE public.consent_records SET status = 'pending', granted_at = NULL, granted_by_relation = 'parent', granted_by_email = NULL,
             grace_until = NULL, parent_link_needed = true, parent_email_missing = (_pemail IS NULL), updated_at = now()
       WHERE id = _rec.id;
    ELSIF _rec.needs_self_confirmation THEN
      UPDATE public.consent_records SET needs_self_confirmation = false, updated_at = now() WHERE id = _rec.id;
    END IF;
  ELSE
    IF _rec.status = 'pending' AND _rec.granted_by_relation = 'parent' THEN
      _t := 'parent_pending_to_self';
      UPDATE public.consent_records SET granted_by_relation = 'self', granted_by_email = NULL,
             parent_link_needed = false, parent_email_missing = false, updated_at = now()
       WHERE id = _rec.id;
    ELSIF _rec.status = 'granted' AND _rec.granted_by_relation = 'parent' AND NOT _rec.needs_self_confirmation THEN
      _t := 'parent_grant_needs_self_confirmation';
      UPDATE public.consent_records SET needs_self_confirmation = true, updated_at = now() WHERE id = _rec.id;
    END IF;
  END IF;

  IF _t <> 'none' THEN
    INSERT INTO public.consent_token_events(token_id, athlete_id, club_id, event, meta)
    VALUES (NULL, _athlete, coalesce(_rec.club_id, _club), 'requirement_recomputed',
            jsonb_build_object('transition', _t, 'age', _age, 'consent_age', _ca));
  END IF;
  IF _t = 'none' AND _created THEN RETURN 'created'; END IF;
  RETURN _t;
END;
$function$;

-- Daily sweep: ages change on birthdays without any profile update.
CREATE OR REPLACE FUNCTION public.recompute_consent_requirements_daily()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _id uuid; _n int := 0; _r text;
BEGIN
  FOR _id IN
    SELECT cr.athlete_id FROM public.consent_records cr
    JOIN public.profiles p ON p.user_id = cr.athlete_id
    WHERE cr.consent_type = 'health_data_processing' AND p.birth_date IS NOT NULL
      AND cr.status IN ('pending','granted')
  LOOP
    _r := public.recompute_consent_requirement(_id);
    IF _r <> 'none' THEN _n := _n + 1; END IF;
  END LOOP;
  RETURN _n;
END $function$;
REVOKE ALL ON FUNCTION public.recompute_consent_requirements_daily() FROM PUBLIC, anon, authenticated;