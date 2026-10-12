DROP POLICY IF EXISTS "Anyone can read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view club logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read landing hero" ON storage.objects;
DROP POLICY IF EXISTS "Recipe images are publicly readable" ON storage.objects;

CREATE POLICY "Admins can list blog images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can list club logos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'club-logos' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can list landing hero" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'landing-hero' AND public.is_admin(auth.uid()));
CREATE POLICY "Users can list their own recipe images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recipe-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can record a CTA click" ON public.cta_clicks;
CREATE POLICY "Anyone can record a CTA click" ON public.cta_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (
    cta ~ '^[a-z0-9_]{1,60}$'
    AND left(page, 1) = '/'
    AND created_at BETWEEN now() - interval '1 minute' AND now() + interval '1 minute'
  );