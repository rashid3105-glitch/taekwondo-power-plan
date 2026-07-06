
-- Extend push_subscriptions for FCM (native + web)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows as web (VAPID); allow endpoint OR fcm_token
UPDATE public.push_subscriptions SET platform = 'web' WHERE platform IS NULL;

-- Loosen legacy NOT NULLs so native rows (no endpoint/p256dh/auth) can insert.
ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint DROP NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN p256dh DROP NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN auth DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_platform_chk') THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_platform_chk
      CHECK (platform IN ('web','ios','android'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_fcm_uidx
  ON public.push_subscriptions (user_id, fcm_token)
  WHERE fcm_token IS NOT NULL;

-- Per-user push toggle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true;
