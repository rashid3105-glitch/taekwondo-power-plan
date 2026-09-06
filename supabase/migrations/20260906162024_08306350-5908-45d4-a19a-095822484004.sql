ALTER TABLE public.club_assessments
  ADD COLUMN IF NOT EXISTS followup_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS followup_note text;

ALTER TABLE public.club_assessments
  ADD CONSTRAINT club_assessments_followup_status_check
  CHECK (followup_status IN ('new','contacted','declined','won'));