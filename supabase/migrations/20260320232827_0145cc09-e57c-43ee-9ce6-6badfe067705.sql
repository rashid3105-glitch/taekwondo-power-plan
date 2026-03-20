
-- Drop existing coach DELETE policy and re-create with role check
DROP POLICY IF EXISTS "Coaches can remove athletes" ON public.coach_athletes;

CREATE POLICY "Coaches can remove athletes"
ON public.coach_athletes
FOR DELETE
TO authenticated
USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'));
