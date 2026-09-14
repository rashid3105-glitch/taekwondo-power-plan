-- 1. Fixed 18-year product-safety age lookup (fails closed on unknown age).
CREATE OR REPLACE FUNCTION public.is_minor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN true
    ELSE COALESCE((
      SELECT CASE
        WHEN p.birth_date IS NOT NULL THEN p.birth_date > (CURRENT_DATE - INTERVAL '18 years')
        WHEN p.age IS NOT NULL THEN p.age < 18
        ELSE true
      END
      FROM public.profiles p
      WHERE p.user_id = _user_id
      LIMIT 1
    ), true)
  END;
$$;

COMMENT ON FUNCTION public.is_minor(uuid) IS
  'Fixed 18-year product-safety threshold for numeric weight/nutrition targets. NOT related to GDPR Art. 8 digital consent age (see consent_age_for_athlete). Fails closed: unknown age = minor.';

GRANT EXECUTE ON FUNCTION public.is_minor(uuid) TO authenticated, service_role;

-- Helper: does a nutrition plan carry numeric calorie/macro targets?
CREATE OR REPLACE FUNCTION public.nutrition_plan_has_numeric_targets(_custom_calories integer, _plan_data jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _custom_calories IS NOT NULL
     OR (
       _plan_data IS NOT NULL
       AND _plan_data::text ~* '("(dailyCalorieEstimate|calorieTarget|calories|kcal|protein|carbs|carbohydrates|fats|fat|macroSplit|macros)"\s*:\s*[^,}]*[0-9])|([0-9][0-9.,]*\s*(kcal|kalorier|calories|kalorien|kalorier/dag))'
     );
$$;

GRANT EXECUTE ON FUNCTION public.nutrition_plan_has_numeric_targets(integer, jsonb) TO authenticated, service_role;

-- 2. Weight goals: no insert/update for or by minors.
DROP POLICY IF EXISTS "Minors cannot create weight goals" ON public.weight_goals;
CREATE POLICY "Minors cannot create weight goals"
ON public.weight_goals AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id));

DROP POLICY IF EXISTS "Minors cannot change weight goals" ON public.weight_goals;
CREATE POLICY "Minors cannot change weight goals"
ON public.weight_goals AS RESTRICTIVE FOR UPDATE TO authenticated
USING (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id))
WITH CHECK (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id));

-- 3. Nutrition plans: no numeric calorie/macro targets for or by minors.
DROP POLICY IF EXISTS "Minors cannot store numeric nutrition targets (insert)" ON public.nutrition_plans;
CREATE POLICY "Minors cannot store numeric nutrition targets (insert)"
ON public.nutrition_plans AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
  NOT public.nutrition_plan_has_numeric_targets(custom_calories, plan_data)
  OR (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id))
);

DROP POLICY IF EXISTS "Minors cannot store numeric nutrition targets (update)" ON public.nutrition_plans;
CREATE POLICY "Minors cannot store numeric nutrition targets (update)"
ON public.nutrition_plans AS RESTRICTIVE FOR UPDATE TO authenticated
USING (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id))
WITH CHECK (
  NOT public.nutrition_plan_has_numeric_targets(custom_calories, plan_data)
  OR (NOT public.is_minor(auth.uid()) AND NOT public.is_minor(user_id))
);

-- 4. profiles.custom_calories cannot be changed for/by a minor (column-level guard).
CREATE OR REPLACE FUNCTION public.block_minor_custom_calories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.custom_calories IS DISTINCT FROM OLD.custom_calories
     AND auth.uid() IS NOT NULL
     AND (public.is_minor(auth.uid()) OR public.is_minor(NEW.user_id)) THEN
    RAISE EXCEPTION 'minor_calorie_target_not_allowed'
      USING HINT = 'Calorie targets are not available for athletes under 18.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_minor_custom_calories ON public.profiles;
CREATE TRIGGER trg_block_minor_custom_calories
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.block_minor_custom_calories();