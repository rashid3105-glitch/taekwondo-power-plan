CREATE OR REPLACE FUNCTION public.consent_ages_for_athletes(_ids uuid[])
RETURNS TABLE(athlete_id uuid, applicable_age smallint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, public.consent_age_for_athlete(p.user_id)
  FROM public.profiles p
  WHERE p.user_id = ANY(_ids)
$$;

REVOKE EXECUTE ON FUNCTION public.consent_ages_for_athletes(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consent_ages_for_athletes(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.consent_ages_for_athletes(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consent_ages_for_athletes(uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_consent_age_overview()
RETURNS TABLE(
  club_id uuid,
  club_name text,
  club_country text,
  applicable_age smallint,
  athletes integer,
  missing_birth_date integer,
  requires_guardian integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.country,
    max(public.consent_age_for_athlete(p.user_id))::smallint,
    count(*)::int,
    count(*) FILTER (WHERE p.birth_date IS NULL)::int,
    count(*) FILTER (
      WHERE p.birth_date IS NOT NULL
        AND date_part('year', age(p.birth_date))::int
            < public.consent_age_for_athlete(p.user_id)
    )::int
  FROM public.profiles p
  JOIN public.clubs c ON c.id = p.club_id
  WHERE coalesce(p.active_role, p.role) = 'athlete'
  GROUP BY c.id, c.name, c.country
  ORDER BY c.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_consent_age_overview() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_consent_age_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_consent_age_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_consent_age_overview() TO service_role;