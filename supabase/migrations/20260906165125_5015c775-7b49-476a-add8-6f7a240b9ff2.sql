CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  type text,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

GRANT ALL ON public.stripe_webhook_events TO service_role;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Admins can read stripe webhook events"
ON public.stripe_webhook_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));