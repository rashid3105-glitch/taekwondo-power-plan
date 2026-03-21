DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.get_profile_protected_fields(auth.uid()) AS f
    WHERE is_approved = f.is_approved
      AND payment_status = f.payment_status
      AND NOT (payment_date IS DISTINCT FROM f.payment_date)
      AND is_demo = f.is_demo
      AND (
        NOT (club_id IS DISTINCT FROM f.club_id)
        OR (f.club_id IS NULL AND club_id IS NOT NULL)
      )
  )
);