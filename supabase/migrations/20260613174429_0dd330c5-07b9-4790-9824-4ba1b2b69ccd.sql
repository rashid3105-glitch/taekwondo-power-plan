
-- Add restrictive deny-by-default SELECT policy on consent_tokens (service role bypasses RLS)
CREATE POLICY "Deny all client access to consent_tokens"
ON public.consent_tokens FOR SELECT
TO authenticated, anon
USING (false);

-- Add v2 club-based coach SELECT policy for workout_logs, consistent with other tables
CREATE POLICY "Coaches read club workout_logs v2"
ON public.workout_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND users_share_club(auth.uid(), user_id)
);
