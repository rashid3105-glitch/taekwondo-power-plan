UPDATE public.digital_consent_ages SET age = 15, updated_at = now() WHERE country_code IN ('DK','SE','NO');
UPDATE public.platform_settings SET value = '16'::jsonb, updated_at = now() WHERE key = 'default_consent_age';

CREATE OR REPLACE FUNCTION public.consent_age_for_athlete(_athlete_id uuid)
 RETURNS smallint LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _default smallint; _country text; _club uuid; _country_age smallint; _override smallint;
BEGIN
  SELECT (value #>> '{}')::smallint INTO _default FROM public.platform_settings WHERE key = 'default_consent_age';
  _default := coalesce(_default, 18);

  SELECT public.normalize_country(p.country), p.club_id INTO _country, _club
  FROM public.profiles p WHERE p.user_id = _athlete_id;

  SELECT age INTO _country_age FROM public.digital_consent_ages WHERE country_code = _country;
  SELECT c.digital_consent_age INTO _override FROM public.clubs c WHERE c.id = _club;

  -- Country age (or default); a club override may only raise it.
  RETURN greatest(coalesce(_country_age, _default), coalesce(_override, 0))::smallint;
EXCEPTION WHEN OTHERS THEN
  RETURN 18;
END;
$function$;

CREATE OR REPLACE FUNCTION public.consent_age_for_club(_club_id uuid)
 RETURNS smallint LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _default smallint; _override smallint; _country text; _country_age smallint;
BEGIN
  SELECT (value #>> '{}')::smallint INTO _default FROM public.platform_settings WHERE key = 'default_consent_age';
  _default := coalesce(_default, 18);

  SELECT c.digital_consent_age, public.normalize_country(c.country) INTO _override, _country
  FROM public.clubs c WHERE c.id = _club_id;

  SELECT age INTO _country_age FROM public.digital_consent_ages WHERE country_code = _country;
  RETURN greatest(coalesce(_country_age, _default), coalesce(_override, 0))::smallint;
EXCEPTION WHEN OTHERS THEN
  RETURN 18;
END;
$function$;