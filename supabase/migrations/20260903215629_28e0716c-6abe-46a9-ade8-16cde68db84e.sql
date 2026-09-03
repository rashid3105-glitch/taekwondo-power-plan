-- 1. Club-level configuration
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS digital_consent_age smallint,
  ADD COLUMN IF NOT EXISTS country text;

-- 2. Reference table: GDPR Art. 8 digital consent age per country
CREATE TABLE public.digital_consent_ages (
  country_code text NOT NULL PRIMARY KEY,
  age smallint NOT NULL CHECK (age BETWEEN 13 AND 16),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.digital_consent_ages TO authenticated;
GRANT SELECT ON public.digital_consent_ages TO anon;
GRANT ALL ON public.digital_consent_ages TO service_role;

ALTER TABLE public.digital_consent_ages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read digital consent ages"
ON public.digital_consent_ages FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER update_digital_consent_ages_updated_at
BEFORE UPDATE ON public.digital_consent_ages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.digital_consent_ages (country_code, age) VALUES
  ('DK',13),('SE',13),('NO',13),('FI',13),('EE',13),('LV',13),('PT',13),('BE',13),('MT',13),
  ('AT',14),('BG',14),('CY',14),('IT',14),('LT',14),('ES',14),
  ('CZ',15),('GR',15),('FR',15),('SI',15),('HR',15),
  ('DE',16),('HU',16),('IE',16),('LU',16),('NL',16),('PL',16),('RO',16),('SK',16)
ON CONFLICT (country_code) DO NOTHING;

-- 3. Platform settings
CREATE TABLE public.platform_settings (
  key text NOT NULL PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read platform settings"
ON public.platform_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage platform settings"
ON public.platform_settings FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings (key, value) VALUES
  ('default_consent_age', '18'::jsonb),
  ('consent_age_source', '"strictest"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Country normalisation helper
CREATE OR REPLACE FUNCTION public.normalize_country(_country text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
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
    WHEN '' THEN NULL
    ELSE upper(btrim(_country))
  END
$$;

-- 5. Which consent age applies to an athlete?
--    club override > (club country vs athlete country, resolved by the
--    configurable consent_age_source flag) > platform default.
CREATE OR REPLACE FUNCTION public.consent_age_for_athlete(_athlete_id uuid)
RETURNS smallint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _default smallint;
  _source text;
  _club_override smallint;
  _club_country text;
  _athlete_country text;
  _club_age smallint;
  _residence_age smallint;
BEGIN
  SELECT (value #>> '{}')::smallint INTO _default
  FROM public.platform_settings WHERE key = 'default_consent_age';
  _default := coalesce(_default, 18);

  SELECT (value #>> '{}') INTO _source
  FROM public.platform_settings WHERE key = 'consent_age_source';
  _source := coalesce(_source, 'strictest');

  SELECT c.digital_consent_age, public.normalize_country(c.country),
         public.normalize_country(p.country)
    INTO _club_override, _club_country, _athlete_country
  FROM public.profiles p
  LEFT JOIN public.clubs c ON c.id = p.club_id
  WHERE p.user_id = _athlete_id;

  IF _club_override IS NOT NULL THEN
    RETURN _club_override;
  END IF;

  SELECT age INTO _club_age FROM public.digital_consent_ages WHERE country_code = _club_country;
  SELECT age INTO _residence_age FROM public.digital_consent_ages WHERE country_code = _athlete_country;

  IF _source = 'controller_first' THEN
    RETURN coalesce(_club_age, _residence_age, _default);
  ELSIF _source = 'residence_first' THEN
    RETURN coalesce(_residence_age, _club_age, _default);
  ELSE -- 'strictest': the highest of the known ages
    RETURN coalesce(greatest(coalesce(_club_age, 0), coalesce(_residence_age, 0)), 0)
           * (CASE WHEN _club_age IS NULL AND _residence_age IS NULL THEN 0 ELSE 1 END)
           + (CASE WHEN _club_age IS NULL AND _residence_age IS NULL THEN _default ELSE 0 END);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consent_age_for_athlete(uuid) FROM anon;

-- 6. Re-runnable review job: REPORTS ONLY, never mutates consent status.
CREATE OR REPLACE FUNCTION public.review_consent_requirements()
RETURNS TABLE(
  athlete_id uuid,
  display_name text,
  club_id uuid,
  birth_date date,
  applicable_age smallint,
  age_years integer,
  requires_guardian boolean,
  age_known boolean,
  consent_status text,
  grace_until timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.display_name,
    p.club_id,
    p.birth_date,
    public.consent_age_for_athlete(p.user_id) AS applicable_age,
    CASE WHEN p.birth_date IS NULL THEN NULL
         ELSE date_part('year', age(p.birth_date))::int END AS age_years,
    CASE WHEN p.birth_date IS NULL THEN NULL
         ELSE date_part('year', age(p.birth_date))::int
              < public.consent_age_for_athlete(p.user_id) END AS requires_guardian,
    p.birth_date IS NOT NULL AS age_known,
    coalesce(cr.status, 'none') AS consent_status,
    cr.grace_until
  FROM public.profiles p
  LEFT JOIN public.consent_records cr
    ON cr.athlete_id = p.user_id AND cr.consent_type = 'health_data_processing'
  WHERE coalesce(p.active_role, p.role) = 'athlete'
$$;

REVOKE EXECUTE ON FUNCTION public.review_consent_requirements() FROM anon;

-- 7. Staggered grace deadlines for everyone not yet granted.
UPDATE public.consent_records cr
SET grace_until = now()
  + (CASE (abs(hashtext(cr.athlete_id::text)) % 3)
       WHEN 0 THEN interval '21 days'
       WHEN 1 THEN interval '45 days'
       ELSE interval '60 days'
     END)
  + ((abs(hashtext(cr.athlete_id::text || 'jitter')) % 5) * interval '1 day')
WHERE cr.consent_type = 'health_data_processing'
  AND cr.status <> 'granted'
  AND cr.grace_until IS NULL;