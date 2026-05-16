-- Replace the loose ALL policy with stricter per-command policies that prevent
-- an attacker from creating an invite already pre-linked to an arbitrary parent.
DROP POLICY IF EXISTS "Athletes manage own parent invites" ON public.parent_invites;

CREATE POLICY "Athletes insert own parent invites"
  ON public.parent_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    athlete_id = auth.uid()
    AND parent_user_id IS NULL
    AND used_at IS NULL
  );

CREATE POLICY "Athletes select own parent invites"
  ON public.parent_invites
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes update own parent invites"
  ON public.parent_invites
  FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (
    athlete_id = auth.uid()
    -- block athletes from self-linking a parent via UPDATE; that's server-only
    AND parent_user_id IS NULL
  );

CREATE POLICY "Athletes delete own parent invites"
  ON public.parent_invites
  FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid());