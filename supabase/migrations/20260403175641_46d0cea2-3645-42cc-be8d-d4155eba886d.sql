
DROP POLICY "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
);
