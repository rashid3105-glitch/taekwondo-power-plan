
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS invitation_pdf_url text;

DROP POLICY IF EXISTS "Coaches can upload competition invitations" ON storage.objects;
CREATE POLICY "Coaches can upload competition invitations"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'competition-invitations'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.coach_athletes WHERE coach_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Uploaders can delete their competition invitations" ON storage.objects;
CREATE POLICY "Uploaders can delete their competition invitations"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'competition-invitations' AND owner = auth.uid());
