-- 1. blog_comments: defense-in-depth, no role may read/write unless admin
REVOKE ALL ON public.blog_comments FROM anon, authenticated;
CREATE POLICY "Restrict all blog comment access to admins"
  ON public.blog_comments AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

-- 2. club_assessments: explicit restrictive block (lead PII)
REVOKE ALL ON public.club_assessments FROM anon, authenticated;
CREATE POLICY "Block non-admin access to club assessments"
  ON public.club_assessments AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

-- 3. video_notes: make video_id a real uuid FK and drop fragile text casts
DROP POLICY IF EXISTS "Athlete can view notes on own videos" ON public.video_notes;
DROP POLICY IF EXISTS "Coach can view notes on own videos" ON public.video_notes;
DROP POLICY IF EXISTS "Coaches read club video notes v2" ON public.video_notes;

DELETE FROM public.video_notes n
 WHERE NOT EXISTS (SELECT 1 FROM public.match_videos v WHERE v.id::text = n.video_id);

ALTER TABLE public.video_notes
  ALTER COLUMN video_id TYPE uuid USING video_id::uuid;

ALTER TABLE public.video_notes
  ADD CONSTRAINT video_notes_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES public.match_videos(id) ON DELETE CASCADE;

CREATE POLICY "Athlete can view notes on own videos"
  ON public.video_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.match_videos v
                  WHERE v.id = video_notes.video_id AND v.athlete_id = auth.uid()));

CREATE POLICY "Coach can view notes on own videos"
  ON public.video_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.match_videos v
                  WHERE v.id = video_notes.video_id AND v.coach_id = auth.uid()));

CREATE POLICY "Coaches read club video notes v2"
  ON public.video_notes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.match_videos mv
     WHERE mv.id = video_notes.video_id
       AND (
         (mv.club_id IS NOT NULL AND is_coach_of_club(mv.club_id))
         OR (mv.club_id IS NULL AND has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), mv.athlete_id))
       )
  ));