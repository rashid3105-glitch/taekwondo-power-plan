
-- Drop the existing permissive self-update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Re-create with a WITH CHECK that prevents users from changing sensitive fields
-- The trick: allow the update only if the sensitive columns remain unchanged
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.user_id = auth.uid())
  AND payment_status = (SELECT p.payment_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND payment_date IS NOT DISTINCT FROM (SELECT p.payment_date FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_demo = (SELECT p.is_demo FROM public.profiles p WHERE p.user_id = auth.uid())
);
