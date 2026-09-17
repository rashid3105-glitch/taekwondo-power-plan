CREATE TABLE IF NOT EXISTS public.retention_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  cron_secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.retention_config TO service_role;
ALTER TABLE public.retention_config ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.retention_config IS
  'Single-row internal config for the nightly retention cleanup. Service role only - no user-facing policies by design.';

INSERT INTO public.retention_config (id) VALUES (true) ON CONFLICT (id) DO NOTHING;