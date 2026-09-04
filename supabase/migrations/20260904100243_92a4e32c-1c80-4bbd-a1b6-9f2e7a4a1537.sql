ALTER TABLE public.club_assessments
  ADD COLUMN IF NOT EXISTS ai_analysis text,
  ADD COLUMN IF NOT EXISTS ai_analysis_at timestamptz;