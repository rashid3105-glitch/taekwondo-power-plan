ALTER TABLE public.club_assessments ADD COLUMN IF NOT EXISTS archived_at timestamptz;
GRANT SELECT, UPDATE ON public.club_assessments TO authenticated;
GRANT ALL ON public.club_assessments TO service_role;