ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_toast_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_sound_enabled boolean NOT NULL DEFAULT true;