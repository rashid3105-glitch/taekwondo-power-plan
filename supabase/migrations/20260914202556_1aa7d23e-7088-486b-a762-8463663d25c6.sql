ALTER POLICY "Minors cannot store numeric nutrition targets (update)"
ON public.nutrition_plans
USING (
  (NOT public.nutrition_plan_has_numeric_targets(custom_calories, plan_data))
  OR ((NOT public.is_minor(auth.uid())) AND (NOT public.is_minor(user_id)))
)
WITH CHECK (
  (NOT public.nutrition_plan_has_numeric_targets(custom_calories, plan_data))
  OR ((NOT public.is_minor(auth.uid())) AND (NOT public.is_minor(user_id)))
);