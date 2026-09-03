CREATE TABLE public.consent_token_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id uuid NOT NULL REFERENCES public.consent_tokens(id) ON DELETE CASCADE,
  athlete_id uuid,
  club_id uuid,
  event text NOT NULL CHECK (event IN ('sent','opened','confirmed','not_my_child','reminder_sent')),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_token_events_token ON public.consent_token_events(token_id);
CREATE INDEX idx_consent_token_events_event ON public.consent_token_events(event, occurred_at DESC);

GRANT SELECT ON public.consent_token_events TO authenticated;
GRANT ALL ON public.consent_token_events TO service_role;

ALTER TABLE public.consent_token_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consent token events"
ON public.consent_token_events FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));