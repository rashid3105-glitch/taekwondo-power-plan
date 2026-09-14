REVOKE ALL ON FUNCTION public.is_minor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.nutrition_plan_has_numeric_targets(integer, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_minor_custom_calories() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_minor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nutrition_plan_has_numeric_targets(integer, jsonb) TO authenticated, service_role;