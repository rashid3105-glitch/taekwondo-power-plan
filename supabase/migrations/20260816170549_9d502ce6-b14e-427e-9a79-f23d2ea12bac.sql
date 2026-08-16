DROP POLICY IF EXISTS "Coaches can upload competition invitations" ON storage.objects;
CREATE POLICY "Coaches can upload competition invitations"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'competition-invitations'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Coaches can delete own match video files" ON storage.objects;
CREATE POLICY "Coaches can delete own match video files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'match_videos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND NOT EXISTS (
    SELECT 1 FROM public.match_videos v
    WHERE v.storage_path = storage.objects.name
      AND v.coach_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can update own match video files" ON storage.objects;
CREATE POLICY "Coaches can update own match video files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'match_videos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND NOT EXISTS (
    SELECT 1 FROM public.match_videos v
    WHERE v.storage_path = storage.objects.name
      AND v.coach_id <> auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'match_videos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);