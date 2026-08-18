GRANT INSERT ON public.club_assessments TO anon, authenticated;

DROP POLICY IF EXISTS "Block non-admin access to club assessments" ON public.club_assessments;

CREATE POLICY "Block non-admin select on club assessments"
  ON public.club_assessments AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Block non-admin update on club assessments"
  ON public.club_assessments AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Block non-admin delete on club assessments"
  ON public.club_assessments AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Anyone can submit club assessments"
  ON public.club_assessments FOR INSERT TO anon, authenticated
  WITH CHECK (
    consent = true
    AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(btrim(email)) BETWEEN 3 AND 255
    AND (club_name IS NULL OR length(btrim(club_name)) <= 200)
  );