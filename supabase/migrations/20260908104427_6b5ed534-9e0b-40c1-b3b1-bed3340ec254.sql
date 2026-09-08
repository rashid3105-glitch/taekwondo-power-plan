ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS lead_note text,
  ADD COLUMN IF NOT EXISTS lead_status_updated_at timestamptz;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_lead_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_lead_status_check
  CHECK (lead_status IN ('new','contacted','declined','won'));

CREATE INDEX IF NOT EXISTS profiles_lead_status_idx ON public.profiles (lead_status);