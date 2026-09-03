REVOKE EXECUTE ON FUNCTION public.review_consent_requirements() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.review_consent_requirements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_consent_requirements() TO service_role;