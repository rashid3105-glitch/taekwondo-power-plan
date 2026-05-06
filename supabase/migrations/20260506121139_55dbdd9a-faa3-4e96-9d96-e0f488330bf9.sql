
ALTER TABLE public.user_recipes ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Recipe images are publicly readable" ON storage.objects;
CREATE POLICY "Recipe images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

DROP POLICY IF EXISTS "Users can upload their own recipe images" ON storage.objects;
CREATE POLICY "Users can upload their own recipe images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own recipe images" ON storage.objects;
CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own recipe images" ON storage.objects;
CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);
