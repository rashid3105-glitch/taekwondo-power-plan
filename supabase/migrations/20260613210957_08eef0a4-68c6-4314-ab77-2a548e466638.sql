
-- Lock down client SELECT on sensitive email tables (defense in depth)
CREATE POLICY "No client read on contact_submissions"
  ON public.contact_submissions
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "No client read on suppressed_emails"
  ON public.suppressed_emails
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Allow coaches (same club) and linked parents to view athlete achievements
CREATE POLICY "Coaches in club can view athlete achievements"
  ON public.athlete_achievements
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND public.users_share_club(auth.uid(), user_id)
  );

CREATE POLICY "Parents can view their athletes' achievements"
  ON public.athlete_achievements
  FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));
