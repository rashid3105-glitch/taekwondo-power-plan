
-- Passkey credentials per user
CREATE TABLE public.user_passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[],
  device_label TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own passkeys"
  ON public.user_passkeys FOR DELETE
  USING (auth.uid() = user_id);

-- Inserts/updates happen via service-role edge functions only (no user policy needed)

-- Short-lived WebAuthn challenges (registration + authentication)
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge TEXT NOT NULL UNIQUE,
  user_id UUID,
  email TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('register', 'login')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webauthn_challenges_challenge ON public.webauthn_challenges(challenge);
CREATE INDEX idx_webauthn_challenges_expires_at ON public.webauthn_challenges(expires_at);

ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
-- No policies: only service role accesses this table

-- Profile flag to track if user has dismissed the "Enable Face ID" prompt
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passkey_prompt_dismissed_at TIMESTAMPTZ;
