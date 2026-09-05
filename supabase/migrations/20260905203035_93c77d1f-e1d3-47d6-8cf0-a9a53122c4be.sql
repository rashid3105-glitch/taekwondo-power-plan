CREATE TABLE public.scheduled_job_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','error')),
  considered integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  error text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_job_runs_job_started ON public.scheduled_job_runs (job_name, started_at DESC);

GRANT SELECT ON public.scheduled_job_runs TO authenticated;
GRANT ALL ON public.scheduled_job_runs TO service_role;

ALTER TABLE public.scheduled_job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scheduled job runs"
ON public.scheduled_job_runs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));