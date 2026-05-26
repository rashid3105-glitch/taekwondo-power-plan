
-- Survey templates: reusable survey definitions, shared in club by default
CREATE TABLE public.survey_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  club_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  allow_anonymous BOOLEAN NOT NULL DEFAULT false,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_shared_with_club BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_templates TO authenticated;
GRANT ALL ON public.survey_templates TO service_role;

ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;

-- Owner full CRUD
CREATE POLICY "Coach manages own templates" ON public.survey_templates
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'::app_role));

-- Club coaches read shared, non-archived templates from same club
CREATE POLICY "Club coaches read shared templates" ON public.survey_templates
  FOR SELECT TO authenticated
  USING (
    coach_id <> auth.uid()
    AND is_shared_with_club = true
    AND archived_at IS NULL
    AND has_role(auth.uid(), 'coach'::app_role)
    AND club_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.club_id = survey_templates.club_id
    )
  );

CREATE INDEX idx_survey_templates_coach ON public.survey_templates(coach_id);
CREATE INDEX idx_survey_templates_club ON public.survey_templates(club_id) WHERE is_shared_with_club = true;
CREATE INDEX idx_survey_templates_archived ON public.survey_templates(archived_at) WHERE archived_at IS NOT NULL;

CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON public.survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-delete archived templates older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_archived_survey_templates()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.survey_templates
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - interval '90 days';
$$;
