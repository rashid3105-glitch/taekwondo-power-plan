
-- 1. Remove coach self-assignment INSERT policy
DROP POLICY IF EXISTS "Coaches can add athletes" ON public.coach_athletes;

-- 2. Replace coach UPDATE policy on profiles to also protect club_id
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;

CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.user_id
  ))
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(profiles.user_id) f))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(profiles.user_id) f)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(profiles.user_id) f))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(profiles.user_id) f)))
);
