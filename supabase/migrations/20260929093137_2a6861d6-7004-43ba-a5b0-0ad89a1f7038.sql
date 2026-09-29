ALTER TABLE public.diary_entries ADD COLUMN IF NOT EXISTS mood integer NULL, ADD COLUMN IF NOT EXISTS energy integer NULL;
COMMENT ON COLUMN public.diary_entries.mood IS 'Deprecated – kun til bagudkompatibilitet med ældre app-builds. Altid NULL. Fjernes når alle klienter er ≥ næste build.';
COMMENT ON COLUMN public.diary_entries.energy IS 'Deprecated – kun til bagudkompatibilitet med ældre app-builds. Altid NULL. Fjernes når alle klienter er ≥ næste build.';

-- BEFORE: stash legacy values (transaction-local), upsert directly on UPDATE, always NULL the columns.
CREATE OR REPLACE FUNCTION public.diary_legacy_health_before()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.mood IS NOT NULL OR NEW.energy IS NOT NULL THEN
    IF COALESCE(public.has_health_consent(NEW.user_id), false) THEN
      IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.diary_entry_health(entry_id, user_id, mood, energy)
        VALUES (NEW.id, NEW.user_id, NEW.mood, NEW.energy)
        ON CONFLICT (entry_id) DO UPDATE SET mood = EXCLUDED.mood, energy = EXCLUDED.energy
        WHERE public.diary_entry_health.user_id = NEW.user_id;
      ELSE
        PERFORM set_config('app.diary_legacy_' || replace(NEW.id::text, '-', ''),
          coalesce(NEW.mood::text, '') || ',' || coalesce(NEW.energy::text, ''), true);
      END IF;
    END IF;
    NEW.mood := NULL;
    NEW.energy := NULL;
  END IF;
  RETURN NEW;
END $$;

-- AFTER INSERT: the row now exists, so the FK holds.
CREATE OR REPLACE FUNCTION public.diary_legacy_health_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _k text := 'app.diary_legacy_' || replace(NEW.id::text, '-', ''); _v text;
BEGIN
  _v := current_setting(_k, true);
  IF _v IS NULL OR _v = '' THEN RETURN NULL; END IF;
  PERFORM set_config(_k, '', true);
  IF COALESCE(public.has_health_consent(NEW.user_id), false) THEN
    INSERT INTO public.diary_entry_health(entry_id, user_id, mood, energy)
    VALUES (NEW.id, NEW.user_id, nullif(split_part(_v, ',', 1), '')::int, nullif(split_part(_v, ',', 2), '')::int)
    ON CONFLICT (entry_id) DO UPDATE SET mood = EXCLUDED.mood, energy = EXCLUDED.energy
    WHERE public.diary_entry_health.user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.diary_legacy_health_before() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.diary_legacy_health_after_insert() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_diary_legacy_health_before BEFORE INSERT OR UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.diary_legacy_health_before();
CREATE TRIGGER trg_diary_legacy_health_after_insert AFTER INSERT ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.diary_legacy_health_after_insert();