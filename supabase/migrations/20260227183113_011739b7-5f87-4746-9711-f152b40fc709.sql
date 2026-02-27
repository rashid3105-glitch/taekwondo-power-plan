
CREATE TABLE public.rehab_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Rehab Plan',
  injury_description text NOT NULL DEFAULT '',
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rehab_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rehab plans" ON public.rehab_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rehab plans" ON public.rehab_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rehab plans" ON public.rehab_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rehab plans" ON public.rehab_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_rehab_plans_updated_at BEFORE UPDATE ON public.rehab_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
