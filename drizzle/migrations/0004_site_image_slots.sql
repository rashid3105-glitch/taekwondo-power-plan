CREATE TABLE public.site_image_slots (
  slot TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  storage_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_image_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_image_slots TO authenticated;
GRANT ALL ON public.site_image_slots TO service_role;
ALTER TABLE public.site_image_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site image slots" ON public.site_image_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site image slots" ON public.site_image_slots FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));