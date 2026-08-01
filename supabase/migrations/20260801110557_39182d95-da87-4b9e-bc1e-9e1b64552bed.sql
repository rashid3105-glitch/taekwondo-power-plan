CREATE TABLE public.club_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  consent boolean NOT NULL,
  answers jsonb,
  scores jsonb,
  level int,
  weakest text,
  strongest text,
  club_name text,
  sport text,
  role text,
  ip_hash text,
  profile_completed_at timestamptz
);

GRANT ALL ON public.club_assessments TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.club_assessments TO authenticated;

ALTER TABLE public.club_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view assessments"
ON public.club_assessments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update assessments"
ON public.club_assessments FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete assessments"
ON public.club_assessments FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_club_assessments_created_at ON public.club_assessments (created_at DESC);
CREATE INDEX idx_club_assessments_ip_hash ON public.club_assessments (ip_hash, created_at DESC);