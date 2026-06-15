
-- 1) Replace PERMISSIVE-false with RESTRICTIVE deny on consent_tokens
DROP POLICY IF EXISTS "Deny all client access to consent_tokens" ON public.consent_tokens;
CREATE POLICY "Block client SELECT on consent_tokens"
  ON public.consent_tokens
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- 2) Explicit RESTRICTIVE deny for client access to email_send_log
CREATE POLICY "Block client SELECT on email_send_log"
  ON public.email_send_log
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- 3) Prevent duplicate waitlist submissions / email enumeration flood
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique_idx
  ON public.waitlist (lower(email));
