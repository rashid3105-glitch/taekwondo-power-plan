CREATE POLICY "Public can view club logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

CREATE POLICY "Admins can upload club logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'club-logos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update club logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'club-logos' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'club-logos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete club logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'club-logos' AND public.is_admin(auth.uid()));