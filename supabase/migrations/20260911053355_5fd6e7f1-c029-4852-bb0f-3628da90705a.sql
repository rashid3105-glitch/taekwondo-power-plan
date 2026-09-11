ALTER TABLE public.video_notes
  ADD COLUMN IF NOT EXISTS timestamp_seconds numeric(10,3);

UPDATE public.video_notes
SET timestamp_seconds = round((frame_number::numeric / 30), 3)
WHERE timestamp_seconds IS NULL;

COMMENT ON COLUMN public.video_notes.timestamp_seconds IS
  'Exact playback position of the note in seconds. Authoritative; frame_number is kept for backwards compatibility and is derived using the video''s real frame rate.';

CREATE INDEX IF NOT EXISTS idx_video_notes_video_ts
  ON public.video_notes(video_id, timestamp_seconds);