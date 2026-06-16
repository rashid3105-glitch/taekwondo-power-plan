CREATE POLICY "Coaches read club video annotations v2"
ON public.video_annotations
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_videos mv
    WHERE mv.id = video_annotations.video_id
      AND (
        (mv.club_id IS NOT NULL AND public.is_coach_of_club(mv.club_id))
        OR (mv.club_id IS NULL AND public.has_role(auth.uid(), 'coach'::app_role) AND public.users_share_club(auth.uid(), mv.athlete_id))
      )
  )
);

CREATE POLICY "Coaches read club video notes v2"
ON public.video_notes
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_videos mv
    WHERE mv.id::text = video_notes.video_id
      AND (
        (mv.club_id IS NOT NULL AND public.is_coach_of_club(mv.club_id))
        OR (mv.club_id IS NULL AND public.has_role(auth.uid(), 'coach'::app_role) AND public.users_share_club(auth.uid(), mv.athlete_id))
      )
  )
);