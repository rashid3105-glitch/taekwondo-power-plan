ALTER TABLE public.consent_token_events DROP CONSTRAINT consent_token_events_event_check;
ALTER TABLE public.consent_token_events ADD CONSTRAINT consent_token_events_event_check
  CHECK (event = ANY (ARRAY['sent','opened','confirmed','not_my_child','reminder_sent','send_failed','requirement_recomputed']));