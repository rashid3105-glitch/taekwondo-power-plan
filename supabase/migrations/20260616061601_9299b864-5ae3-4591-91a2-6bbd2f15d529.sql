
-- Deny client reads on email_unsubscribe_tokens
CREATE POLICY "Deny anon select on email_unsubscribe_tokens"
ON public.email_unsubscribe_tokens
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);

-- Deny client reads on email_send_state
CREATE POLICY "Deny anon select on email_send_state"
ON public.email_send_state
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);
