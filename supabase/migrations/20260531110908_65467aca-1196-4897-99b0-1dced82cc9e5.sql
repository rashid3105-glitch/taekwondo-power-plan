CREATE TABLE IF NOT EXISTS public.video_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  frame_number int NOT NULL,
  tags text[] DEFAULT '{}',
  note_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_notes TO authenticated;
GRANT ALL ON public.video_notes TO service_role;

ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own video notes"
ON public.video_notes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_video_notes_video ON public.video_notes(video_id, frame_number);