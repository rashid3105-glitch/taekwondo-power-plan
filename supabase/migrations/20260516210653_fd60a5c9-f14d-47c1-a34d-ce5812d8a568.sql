-- Restrict parent_invites UPDATE/DELETE to unused (not yet redeemed) invites
DROP POLICY IF EXISTS "Athletes update own parent invites" ON public.parent_invites;
DROP POLICY IF EXISTS "Athletes delete own parent invites" ON public.parent_invites;

CREATE POLICY "Athletes update own unused parent invites"
  ON public.parent_invites
  FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid() AND used_at IS NULL)
  WITH CHECK (
    athlete_id = auth.uid()
    AND parent_user_id IS NULL
    AND used_at IS NULL
  );

CREATE POLICY "Athletes delete own unused parent invites"
  ON public.parent_invites
  FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid() AND used_at IS NULL);

-- Drop now-redundant anon SELECT policies on public profile child tables.
-- All public profile reads go through get_public_athlete_bundle (SECURITY DEFINER),
-- which already respects is_public + public_show_* visibility toggles.
DROP POLICY IF EXISTS "Public can view achievements when profile is public" ON public.athlete_achievements;
DROP POLICY IF EXISTS "Public can view videos when profile is public" ON public.athlete_highlight_videos;