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
    END IF;
  ELSE
    IF _rec.status = 'pending' AND _rec.granted_by_relation = 'parent' THEN
      _t := 'parent_pending_to_self';
      UPDATE public.consent_records SET granted_by_relation = 'self', granted_by_email = NULL,
             parent_link_needed = false, parent_email_missing = false, updated_at = now()
       WHERE id = _rec.id;
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

CREATE OR REPLACE FUNCTION public.ensure_athlete_consent_record()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role_in_club::text = 'athlete' AND NEW.status::text = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.role_in_club IS DISTINCT FROM NEW.role_in_club) THEN
    PERFORM public.recompute_consent_requirement(NEW.user_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ensure_athlete_consent_record failed for %: %', NEW.user_id, SQLERRM;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ensure_athlete_consent_record() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ensure_athlete_consent_record ON public.club_memberships;
CREATE TRIGGER trg_ensure_athlete_consent_record
AFTER INSERT OR UPDATE OF status, role_in_club ON public.club_memberships
FOR EACH ROW EXECUTE FUNCTION public.ensure_athlete_consent_record();

-- Backfill
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT m.user_id FROM public.club_memberships m
    WHERE m.role_in_club::text='athlete' AND m.status::text='active'
      AND NOT EXISTS (SELECT 1 FROM public.consent_records c WHERE c.athlete_id=m.user_id AND c.consent_type='health_data_processing')
  LOOP PERFORM public.recompute_consent_requirement(r.user_id); END LOOP;
END $$;