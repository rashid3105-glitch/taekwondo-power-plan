-- 1. Allow the conservative 18-year value (current check caps at 16).
ALTER TABLE public.digital_consent_ages DROP CONSTRAINT IF EXISTS digital_consent_ages_age_check;
ALTER TABLE public.digital_consent_ages ADD CONSTRAINT digital_consent_ages_age_check CHECK (age >= 13 AND age <= 18);

-- 2. Recognise UK spellings so lookups match profiles.country.
CREATE OR REPLACE FUNCTION public.normalize_country(_country text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $function$
  SELECT CASE lower(btrim(coalesce(_country, '')))
    WHEN 'denmark' THEN 'DK' WHEN 'danmark' THEN 'DK' WHEN 'dk' THEN 'DK'
    WHEN 'sweden' THEN 'SE' WHEN 'sverige' THEN 'SE' WHEN 'se' THEN 'SE'
    WHEN 'norway' THEN 'NO' WHEN 'norge' THEN 'NO' WHEN 'no' THEN 'NO'
    WHEN 'germany' THEN 'DE' WHEN 'deutschland' THEN 'DE' WHEN 'tyskland' THEN 'DE' WHEN 'de' THEN 'DE'
    WHEN 'spain' THEN 'ES' WHEN 'espana' THEN 'ES' WHEN 'españa' THEN 'ES' WHEN 'spanien' THEN 'ES' WHEN 'es' THEN 'ES'
    WHEN 'finland' THEN 'FI' WHEN 'fi' THEN 'FI'
    WHEN 'netherlands' THEN 'NL' WHEN 'nl' THEN 'NL'
    WHEN 'france' THEN 'FR' WHEN 'fr' THEN 'FR'
    WHEN 'italy' THEN 'IT' WHEN 'it' THEN 'IT'
    WHEN 'united kingdom' THEN 'GB' WHEN 'great britain' THEN 'GB' WHEN 'storbritannien' THEN 'GB'
      WHEN 'uk' THEN 'GB' WHEN 'gb' THEN 'GB' WHEN 'england' THEN 'GB'
    WHEN '' THEN NULL
    ELSE upper(btrim(_country))
  END
$function$;

CREATE OR REPLACE FUNCTION public.canonical_country_name(_country text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $function$
  SELECT CASE public.normalize_country(_country)
    WHEN 'DK' THEN 'Denmark'
    WHEN 'SE' THEN 'Sweden'
    WHEN 'NO' THEN 'Norway'
    WHEN 'DE' THEN 'Germany'
    WHEN 'ES' THEN 'Spain'
    WHEN 'FI' THEN 'Finland'
    WHEN 'NL' THEN 'Netherlands'
    WHEN 'FR' THEN 'France'
    WHEN 'IT' THEN 'Italy'
    WHEN 'GB' THEN 'United Kingdom'
    ELSE nullif(btrim(coalesce(_country, '')), '')
  END
$function$;

-- 3. Single, configurable source of truth for the country values.
--    All values are deliberately set to 18 pending legal assessment.
--    18 is a conscious conservative choice: the national GDPR Art. 8 ages are
--    15 (DK), 13 (SE), 13 (NO) and 13 (UK), but it is NOT settled whether the
--    Art. 8 age is the relevant threshold when processing health data under
--    Art. 9. Changing a value here is a data change, not a code change.
COMMENT ON TABLE public.digital_consent_ages IS
  'Country-specific digital consent ages. All values are currently 18 - a deliberate conservative choice pending legal assessment. National GDPR Art. 8 ages are 15 (DK), 13 (SE), 13 (NO), 13 (UK), but it is unresolved whether the Art. 8 age is the relevant threshold for health data processed under Art. 9. Change values here (data change), not in code.';

UPDATE public.digital_consent_ages SET age = 18, updated_at = now() WHERE age <> 18;

INSERT INTO public.digital_consent_ages (country_code, age) VALUES
  ('DK', 18), ('SE', 18), ('NO', 18), ('GB', 18)
ON CONFLICT (country_code) DO UPDATE SET age = EXCLUDED.age, updated_at = now();

-- 4. Athlete residence only. Club country is never a valid Art. 8 criterion.
--    Fail-safe: any error or unknown country returns the platform default (18).
CREATE OR REPLACE FUNCTION public.consent_age_for_athlete(_athlete_id uuid)
RETURNS smallint LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  _default smallint;
  _athlete_country text;
  _residence_age smallint;
BEGIN
  SELECT (value #>> '{}')::smallint INTO _default
  FROM public.platform_settings WHERE key = 'default_consent_age';
  _default := coalesce(_default, 18);

  SELECT public.normalize_country(p.country) INTO _athlete_country
  FROM public.profiles p WHERE p.user_id = _athlete_id;

  SELECT age INTO _residence_age
  FROM public.digital_consent_ages WHERE country_code = _athlete_country;

  RETURN greatest(coalesce(_residence_age, _default), _default);
EXCEPTION WHEN OTHERS THEN
  RETURN 18;
END;
$function$;