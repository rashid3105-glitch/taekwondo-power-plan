CREATE POLICY "Athlete can manage tags on own videos"
ON public.match_tags
FOR ALL
USING (EXISTS (SELECT 1 FROM public.match_videos v WHERE v.id = match_tags.video_id AND v.athlete_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.match_videos v WHERE v.id = match_tags.video_id AND v.athlete_id = auth.uid()));

CREATE POLICY "Athletes manage annotations on own videos"
ON public.video_annotations
FOR ALL
USING (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.match_videos mv WHERE mv.id = video_annotations.video_id AND mv.athlete_id = auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.match_videos mv WHERE mv.id = video_annotations.video_id AND mv.athlete_id = auth.uid())
);

CREATE POLICY "Coach can view notes on own videos"
ON public.video_notes
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.match_videos v WHERE v.id::text = video_notes.video_id AND v.coach_id = auth.uid()));

CREATE POLICY "Athlete can view notes on own videos"
ON public.video_notes
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.match_videos v WHERE v.id::text = video_notes.video_id AND v.athlete_id = auth.uid()));