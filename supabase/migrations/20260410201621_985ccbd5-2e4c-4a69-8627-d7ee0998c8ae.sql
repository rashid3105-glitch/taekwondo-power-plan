
CREATE TABLE public.nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Nutrition Plan',
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  goals text[] NOT NULL DEFAULT '{}'::text[],
  custom_calories integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition plans" ON public.nutrition_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition plans" ON public.nutrition_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition plans" ON public.nutrition_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition plans" ON public.nutrition_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete nutrition plans" ON public.nutrition_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM coach_athletes WHERE coach_id = auth.uid() AND athlete_id = nutrition_plans.user_id));

CREATE TRIGGER update_nutrition_plans_updated_at
  BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
