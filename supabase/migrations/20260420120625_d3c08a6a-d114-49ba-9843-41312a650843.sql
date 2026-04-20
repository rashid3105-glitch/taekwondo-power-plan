-- Tighten avatars bucket SELECT: only the owner (folder = auth.uid()) or coaches linked to the athlete
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

CREATE POLICY "Users can view their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Coaches can view linked athlete avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Coaches can view club member avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'coach'::public.app_role)
  AND public.users_share_club(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins can view all avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.is_admin(auth.uid())
);