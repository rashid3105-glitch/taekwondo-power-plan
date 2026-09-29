ALTER TABLE public.club_termination_purge_audit
  ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT 'terminated_club';
ALTER TABLE public.club_termination_purge_audit
  ADD CONSTRAINT club_termination_purge_audit_reason_check CHECK (reason IN ('terminated_club','left_club'));
COMMENT ON COLUMN public.club_termination_purge_audit.reason IS 'Why club data was purged: terminated_club (licence ended) or left_club (athlete left, 90 days after membership ended).';