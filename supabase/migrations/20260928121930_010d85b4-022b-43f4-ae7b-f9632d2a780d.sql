ALTER TABLE public.consent_records
  ADD COLUMN IF NOT EXISTS health_data_delete_after timestamptz,
  ADD COLUMN IF NOT EXISTS health_data_purged_at timestamptz;

CREATE TABLE IF NOT EXISTS public.consent_withdrawal_purge_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_record_id uuid,
  purged_at timestamptz NOT NULL DEFAULT now(),
  dry_run boolean NOT NULL DEFAULT false,
  row_counts jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.consent_withdrawal_purge_audit TO authenticated;
GRANT ALL ON public.consent_withdrawal_purge_audit TO service_role;
ALTER TABLE public.consent_withdrawal_purge_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins read withdrawal purge audit"
  ON public.consent_withdrawal_purge_audit FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- One place that reacts to every withdrawal / re-grant, whichever path wrote it.
CREATE OR REPLACE FUNCTION public.consent_withdrawal_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.consent_type <> 'health_data_processing' THEN RETURN NEW; END IF;
  IF NEW.status = 'withdrawn' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'withdrawn') THEN
    NEW.withdrawn_at := COALESCE(NEW.withdrawn_at, now());
    NEW.health_data_delete_after := NEW.withdrawn_at + interval '30 days';
    NEW.health_data_purged_at := NULL;
    UPDATE public.wearable_connections SET status = 'revoked', updated_at = now()
     WHERE user_id = NEW.athlete_id AND status <> 'revoked';
  ELSIF NEW.status = 'granted' THEN
    NEW.health_data_delete_after := NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.consent_withdrawal_effects() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_consent_withdrawal_effects ON public.consent_records;
CREATE TRIGGER trg_consent_withdrawal_effects
  BEFORE INSERT OR UPDATE OF status ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.consent_withdrawal_effects();

ALTER TABLE public.consent_token_events DROP CONSTRAINT IF EXISTS consent_token_events_event_check;
ALTER TABLE public.consent_token_events ADD CONSTRAINT consent_token_events_event_check
  CHECK (event = ANY (ARRAY['sent','opened','confirmed','not_my_child','reminder_sent','send_failed','requirement_recomputed','withdrawn']));

INSERT INTO public.retention_policies (category, retention_days, warn_days, batch_limit, enabled, dry_run, description)
VALUES ('withdrawn_consent_health_data', 30, 0, 200, true, true,
  'Helbredsdata slettes 30 dage efter tilbagekaldt samtykke, medmindre samtykket gives igen')
ON CONFLICT (category) DO NOTHING;