ALTER TABLE public.club_assessments
  ADD COLUMN IF NOT EXISTS questions_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS member_range text,
  ADD COLUMN IF NOT EXISTS coach_range text;