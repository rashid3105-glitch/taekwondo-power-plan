DROP POLICY IF EXISTS "Anyone can submit club assessments" ON public.club_assessments;
REVOKE INSERT ON public.club_assessments FROM anon, authenticated;