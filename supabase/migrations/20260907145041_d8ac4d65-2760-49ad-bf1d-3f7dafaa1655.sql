ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS error text NULL;

UPDATE public.stripe_webhook_events
SET processed_at = NULL,
    error = COALESCE(error, 'Invalid time value')
WHERE event_id IN ('evt_1UD3q2CrYQiZxdDXozJbXQpV', 'evt_1UD3q3CrYQiZxdDX5ZpMtJSV');