ALTER TABLE public.mental_assessments ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 3;
ALTER TABLE public.coach_mental_assessments ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 3;

UPDATE public.mental_assessments SET schema_version = 1 WHERE scores ? 'resilience' OR scores ? 'discipline';
UPDATE public.mental_assessments SET schema_version = 2 WHERE schema_version <> 1 AND NOT (scores ? 'fatigueMotivation');

UPDATE public.coach_mental_assessments SET schema_version = 1;

COMMENT ON COLUMN public.mental_assessments.schema_version IS 'Version of the question/dimension set used for this assessment. Scores with different schema_version values must NEVER be compared, charted together, or averaged. Raise this version whenever the dimension set changes.';
COMMENT ON COLUMN public.coach_mental_assessments.schema_version IS 'Version of the question/dimension set used for this assessment. Scores with different schema_version values must NEVER be compared, charted together, or averaged. Raise this version whenever the dimension set changes.';