CREATE TABLE IF NOT EXISTS public.video_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.match_videos(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_seconds numeric(10,2) NOT NULL,
  paths jsonb NOT NULL DEFAULT '[]',
  color text NOT NULL DEFAULT '#ef4444',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_annotations TO authenticated;
GRANT ALL ON public.video_annotations TO service_role;

ALTER TABLE public.video_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage annotations"
  ON public.video_annotations FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Athletes read annotations for their videos"
  ON public.video_annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.match_videos mv
      WHERE mv.id = video_id AND mv.athlete_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_video_annotations_video_ts
  ON public.video_annotations (video_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_video_annotations_expires
  ON public.video_annotations (expires_at);