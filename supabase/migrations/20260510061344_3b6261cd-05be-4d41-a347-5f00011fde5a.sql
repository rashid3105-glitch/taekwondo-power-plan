ALTER TABLE public.match_videos
  ADD COLUMN IF NOT EXISTS poomsae_type text CHECK (poomsae_type IN ('individual', 'pair', 'team')),
  ADD COLUMN IF NOT EXISTS athlete_age text;