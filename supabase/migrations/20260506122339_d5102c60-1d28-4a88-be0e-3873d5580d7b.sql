CREATE TABLE public.recipe_photo_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE public.recipe_photo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own recipe photo overrides"
ON public.recipe_photo_overrides FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users insert own recipe photo overrides"
ON public.recipe_photo_overrides FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own recipe photo overrides"
ON public.recipe_photo_overrides FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users delete own recipe photo overrides"
ON public.recipe_photo_overrides FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_recipe_photo_overrides_updated_at
BEFORE UPDATE ON public.recipe_photo_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();