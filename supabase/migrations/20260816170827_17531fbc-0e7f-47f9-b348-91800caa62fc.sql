DROP POLICY IF EXISTS "Avatar read" ON storage.objects;

CREATE POLICY "Club members can view member avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.users_share_club(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Parents can view linked athlete avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.is_parent_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);