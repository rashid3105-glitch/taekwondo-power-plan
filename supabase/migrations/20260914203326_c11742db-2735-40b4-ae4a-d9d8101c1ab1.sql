DROP POLICY IF EXISTS "Minors cannot set numeric calorie targets" ON public.profiles;
CREATE POLICY "Minors cannot set numeric calorie targets"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (custom_calories IS NULL OR ((NOT public.is_minor(auth.uid())) AND (NOT public.is_minor(user_id))))
WITH CHECK (custom_calories IS NULL OR ((NOT public.is_minor(auth.uid())) AND (NOT public.is_minor(user_id))));