ALTER TABLE public.consent_records
  ADD COLUMN IF NOT EXISTS grace_days smallint,
  ADD COLUMN IF NOT EXISTS grace_frozen_at timestamptz;

UPDATE public.consent_records
SET grace_days = greatest(21, ceil(extract(epoch from (grace_until - now())) / 86400)::int),
    grace_frozen_at = now(),
    grace_until = NULL
WHERE grace_until IS NOT NULL;

CREATE OR REPLACE FUNCTION public.thaw_consent_grace()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.consent_records
  SET grace_until = now() + make_interval(days => coalesce(grace_days, 21)),
      grace_frozen_at = NULL
  WHERE grace_frozen_at IS NOT NULL AND status <> 'granted';
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.thaw_consent_grace() FROM public;
GRANT EXECUTE ON FUNCTION public.thaw_consent_grace() TO authenticated, service_role;

COMMENT ON FUNCTION public.consent_age_for_athlete(uuid) IS
  'Applicable digital-consent age. Platform default (default_consent_age, today 18) is a FALLBACK only: it applies when neither club country nor athlete residence resolves an age. Under source=strictest the default never participates in the greatest() comparison.';

COMMENT ON COLUMN public.consent_records.grace_days IS
  'Frozen grace budget in days. grace_until stays NULL while enforcement is off; thaw_consent_grace() converts these into real deadlines at cutover.';