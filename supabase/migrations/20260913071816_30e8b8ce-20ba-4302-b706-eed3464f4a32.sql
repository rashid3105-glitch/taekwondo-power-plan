-- 1. Lock down service-role-only tables
REVOKE ALL ON public.consent_tokens FROM anon, authenticated;
GRANT ALL ON public.consent_tokens TO service_role;

REVOKE ALL ON public.club_assessment_profile_attempts FROM anon, authenticated;
GRANT SELECT ON public.club_assessment_profile_attempts TO authenticated; -- admin-only via RLS policy
GRANT ALL ON public.club_assessment_profile_attempts TO service_role;

-- 2. Reference data: read-only, signed-in users only (client reads go through security-definer RPCs)
REVOKE ALL ON public.digital_consent_ages FROM anon, authenticated;
GRANT SELECT ON public.digital_consent_ages TO authenticated;
GRANT ALL ON public.digital_consent_ages TO service_role;
DROP POLICY IF EXISTS "Anyone can read digital consent ages" ON public.digital_consent_ages;
CREATE POLICY "Signed-in users can read digital consent ages"
  ON public.digital_consent_ages FOR SELECT TO authenticated USING (true);

-- 3. Public forms: insert-only for the public, plus database-level throttling
REVOKE ALL ON public.waitlist FROM anon, authenticated;
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT ON public.waitlist TO authenticated; -- admin-only via RLS policy
GRANT ALL ON public.waitlist TO service_role;

REVOKE ALL ON public.contact_submissions FROM anon, authenticated;
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_public_form_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_same_email integer;
  recent_total integer;
BEGIN
  EXECUTE format(
    'SELECT count(*) FROM public.%I WHERE lower(btrim(email)) = $1 AND created_at > now() - interval ''1 hour''',
    TG_TABLE_NAME
  ) INTO recent_same_email USING lower(btrim(NEW.email));

  IF recent_same_email >= 3 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'check_violation';
  END IF;

  EXECUTE format(
    'SELECT count(*) FROM public.%I WHERE created_at > now() - interval ''1 minute''',
    TG_TABLE_NAME
  ) INTO recent_total;

  IF recent_total >= 30 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waitlist_rate_limit ON public.waitlist;
CREATE TRIGGER waitlist_rate_limit
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.enforce_public_form_rate_limit();

DROP TRIGGER IF EXISTS contact_submissions_rate_limit ON public.contact_submissions;
CREATE TRIGGER contact_submissions_rate_limit
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_public_form_rate_limit();