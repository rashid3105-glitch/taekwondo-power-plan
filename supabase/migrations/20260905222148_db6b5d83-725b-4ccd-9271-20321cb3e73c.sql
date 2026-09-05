CREATE OR REPLACE FUNCTION public.canonical_country_name(_country text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
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
    ELSE nullif(btrim(coalesce(_country, '')), '')
  END
$$;

CREATE OR REPLACE FUNCTION public.canonicalize_profile_country()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.country IS NOT NULL THEN
    NEW.country := public.canonical_country_name(NEW.country);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_canonicalize_profile_country ON public.profiles;
CREATE TRIGGER trg_canonicalize_profile_country
BEFORE INSERT OR UPDATE OF country ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.canonicalize_profile_country();