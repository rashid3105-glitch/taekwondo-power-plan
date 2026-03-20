DROP POLICY "Coaches can update athlete profiles" ON public.profiles;

CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.user_id
  )
  AND is_approved = (SELECT p.is_approved FROM profiles p WHERE p.user_id = profiles.user_id)
  AND payment_status = (SELECT p.payment_status FROM profiles p WHERE p.user_id = profiles.user_id)
  AND NOT (payment_date IS DISTINCT FROM (SELECT p.payment_date FROM profiles p WHERE p.user_id = profiles.user_id))
  AND is_demo = (SELECT p.is_demo FROM profiles p WHERE p.user_id = profiles.user_id)
);