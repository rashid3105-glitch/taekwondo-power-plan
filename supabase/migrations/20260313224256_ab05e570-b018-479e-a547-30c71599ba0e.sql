CREATE TABLE public.user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'lunch',
  prep_time text NOT NULL DEFAULT '15 min',
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  ingredients text[] NOT NULL DEFAULT '{}',
  steps text[] NOT NULL DEFAULT '{}',
  tip text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes" ON public.user_recipes FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipes" ON public.user_recipes FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes" ON public.user_recipes FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes" ON public.user_recipes FOR DELETE TO public USING (auth.uid() = user_id);

CREATE TRIGGER update_user_recipes_updated_at BEFORE UPDATE ON public.user_recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();