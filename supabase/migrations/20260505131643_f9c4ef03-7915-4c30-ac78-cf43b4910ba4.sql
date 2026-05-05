
CREATE POLICY "Coaches can upload athlete avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND (ca.athlete_id)::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Coaches can update athlete avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND (ca.athlete_id)::text = (storage.foldername(name))[1]
  )
);
