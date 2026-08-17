DROP POLICY IF EXISTS "Users can view meal photos" ON storage.objects;
CREATE POLICY "Users can view their own meal photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Users can upload their own meal photos" ON storage.objects;
CREATE POLICY "Users can upload their own meal photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete their own meal photos" ON storage.objects;
CREATE POLICY "Users can delete their own meal photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Read competition invitations" ON storage.objects;
CREATE POLICY "Read competition invitations"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'competition-invitations'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.invitation_pdf_url LIKE '%' || storage.objects.name
        AND (
          c.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.coach_athletes ca
            WHERE ca.coach_id = auth.uid() AND ca.athlete_id = c.user_id
          )
        )
    )
  )
);