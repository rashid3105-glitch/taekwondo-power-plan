CREATE TABLE public.club_termination_purge_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  health_data_purged boolean NOT NULL DEFAULT false,
  warning_sent boolean NOT NULL DEFAULT false,
  table_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.club_termination_purge_audit TO authenticated;
GRANT ALL ON public.club_termination_purge_audit TO service_role;
ALTER TABLE public.club_termination_purge_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins read club termination audit"
  ON public.club_termination_purge_audit FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));