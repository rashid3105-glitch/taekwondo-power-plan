-- Add USING clause to "Coaches can update athlete profiles" policy
-- so coaches can only target rows of athletes assigned to them.
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;

CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.user_id
  )
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(profiles.user_id) f))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(profiles.user_id) f)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(profiles.user_id) f))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(profiles.user_id) f)))
);