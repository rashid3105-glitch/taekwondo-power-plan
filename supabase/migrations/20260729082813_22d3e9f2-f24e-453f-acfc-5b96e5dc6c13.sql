CREATE TABLE public.landing_hero_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_hero_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_hero_images TO authenticated;
GRANT ALL ON public.landing_hero_images TO service_role;

ALTER TABLE public.landing_hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero images"
ON public.landing_hero_images FOR SELECT
TO anon, authenticated
USING (active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage hero images"
ON public.landing_hero_images FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Public read landing hero"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-hero');

CREATE POLICY "Admins upload landing hero"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landing-hero' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update landing hero"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landing-hero' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete landing hero"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landing-hero' AND public.is_admin(auth.uid()));