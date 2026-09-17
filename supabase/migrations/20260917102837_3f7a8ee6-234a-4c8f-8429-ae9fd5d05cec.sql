CREATE TABLE public.retention_policies (
  category text PRIMARY KEY,
  retention_days integer NOT NULL CHECK (retention_days > 0),
  warn_days integer NOT NULL DEFAULT 0 CHECK (warn_days >= 0),
  batch_limit integer NOT NULL DEFAULT 500 CHECK (batch_limit > 0),
  enabled boolean NOT NULL DEFAULT true,
  dry_run boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.retention_policies TO authenticated;
GRANT ALL ON public.retention_policies TO service_role;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read retention policies"
ON public.retention_policies FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Platform admins can update retention policies"
ON public.retention_policies FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_retention_policies_updated_at
BEFORE UPDATE ON public.retention_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.retention_policies IS
  'Retention schedule enforced nightly by the retention-cleanup edge function. dry_run = count only, delete nothing.';

CREATE TABLE public.retention_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  subject_id uuid NOT NULL,
  notice_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, subject_id, notice_type)
);

GRANT SELECT ON public.retention_notices TO authenticated;
GRANT ALL ON public.retention_notices TO service_role;
ALTER TABLE public.retention_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read retention notices"
ON public.retention_notices FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_retention_notices_subject ON public.retention_notices (subject_id, category);

COMMENT ON TABLE public.retention_notices IS
  'Records deletion warnings already sent, so the same warning is never repeated.';

CREATE TABLE public.retention_locks (
  lock_name text PRIMARY KEY,
  locked_until timestamptz NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.retention_locks TO service_role;
ALTER TABLE public.retention_locks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.retention_locks IS
  'Single-flight lease for the nightly retention cleanup run.';

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS license_ended_at timestamptz;

COMMENT ON COLUMN public.clubs.license_ended_at IS
  'Set deliberately when a club terminates its licence. Retention cleanup of club data is driven by this column only - never by license_active.';

INSERT INTO public.retention_policies (category, retention_days, warn_days, batch_limit, description) VALUES
  ('inactive_accounts', 365, 30, 200, 'Athlete accounts with no sign-in for 12 months'),
  ('left_club_health_data', 90, 0, 500, 'Health data for athletes whose membership ended 90 days ago'),
  ('terminated_club_data', 90, 60, 500, 'Athlete data for clubs 90 days after license_ended_at'),
  ('soft_deleted_chat_messages', 30, 0, 500, 'Chat messages soft-deleted 30 days ago'),
  ('inactive_chat_threads', 365, 0, 500, 'Chat threads with no activity for 12 months'),
  ('match_videos', 730, 30, 500, 'Match videos 24 months after upload'),
  ('operational_logs', 90, 0, 500, 'Email log, AI assistant log and scheduled job runs'),
  ('consent_documentation', 1825, 0, 500, 'Consent records 5 years after withdrawal or deletion')
ON CONFLICT (category) DO NOTHING;