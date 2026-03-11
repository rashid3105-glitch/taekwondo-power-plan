CREATE POLICY "Admin can delete any training plan"
ON public.training_plans
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));