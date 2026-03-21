
-- Fix privilege escalation: prevent users from changing their own club_id
-- Drop and recreate the "Users can update their own profile" policy with club_id protection

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id)
  AND (is_approved = (SELECT p.is_approved FROM profiles p WHERE p.user_id = auth.uid()))
  AND (payment_status = (SELECT p.payment_status FROM profiles p WHERE p.user_id = auth.uid()))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT p.payment_date FROM profiles p WHERE p.user_id = auth.uid())))
  AND (is_demo = (SELECT p.is_demo FROM profiles p WHERE p.user_id = auth.uid()))
  AND (NOT (club_id IS DISTINCT FROM (SELECT p.club_id FROM profiles p WHERE p.user_id = auth.uid())))
);
