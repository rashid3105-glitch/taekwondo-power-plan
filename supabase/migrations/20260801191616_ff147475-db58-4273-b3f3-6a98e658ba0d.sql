ALTER TABLE public.club_assessments
  ADD COLUMN IF NOT EXISTS report_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS subject_variant text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.club_assessment_profile_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_assessment_profile_attempts_ip_time_idx
  ON public.club_assessment_profile_attempts (ip_hash, created_at DESC);

GRANT ALL ON public.club_assessment_profile_attempts TO service_role;

ALTER TABLE public.club_assessment_profile_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view profile attempts"
  ON public.club_assessment_profile_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));