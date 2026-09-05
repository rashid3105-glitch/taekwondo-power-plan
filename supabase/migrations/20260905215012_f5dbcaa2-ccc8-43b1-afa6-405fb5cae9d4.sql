CREATE OR REPLACE FUNCTION public.consent_age_for_club(_club_id uuid)
RETURNS smallint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _default smallint;
  _club_override smallint;
  _club_country text;
  _club_age smallint;
BEGIN
  SELECT (value #>> '{}')::smallint INTO _default
  FROM public.platform_settings WHERE key = 'default_consent_age';
  _default := coalesce(_default, 18);

  SELECT c.digital_consent_age, public.normalize_country(c.country)
    INTO _club_override, _club_country
  FROM public.clubs c WHERE c.id = _club_id;

  IF _club_override IS NOT NULL THEN
    RETURN _club_override;
  END IF;

  SELECT age INTO _club_age FROM public.digital_consent_ages WHERE country_code = _club_country;
  RETURN coalesce(_club_age, _default);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consent_age_for_club(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consent_age_for_club(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.consent_age_for_club(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consent_age_for_club(uuid) TO service_role;