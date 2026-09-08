ALTER TABLE public.club_assessments
  DROP CONSTRAINT IF EXISTS club_assessments_followup_status_check;

ALTER TABLE public.club_assessments
  ADD CONSTRAINT club_assessments_followup_status_check
  CHECK (followup_status IN ('new','contacted','later','declined','won'));