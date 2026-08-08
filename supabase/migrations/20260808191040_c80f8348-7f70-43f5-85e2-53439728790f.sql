CREATE POLICY "Club members read club drill videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'club-drills'
  AND (
    public.is_member_of_club(((storage.foldername(name))[1])::uuid)
    OR public.is_coach_of_club(((storage.foldername(name))[1])::uuid)
    OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "Club coaches upload club drill videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'club-drills'
  AND (public.is_coach_of_club(((storage.foldername(name))[1])::uuid) OR public.is_admin(auth.uid()))
);

CREATE POLICY "Club coaches update club drill videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'club-drills'
  AND (public.is_coach_of_club(((storage.foldername(name))[1])::uuid) OR public.is_admin(auth.uid()))
);

CREATE POLICY "Club coaches delete club drill videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'club-drills'
  AND (public.is_coach_of_club(((storage.foldername(name))[1])::uuid) OR public.is_admin(auth.uid()))
);