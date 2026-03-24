
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id)
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (
    (SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1) IS NULL
    OR NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  )
);
