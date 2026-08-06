ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS accent_color text;

ALTER TABLE public.clubs
  ADD CONSTRAINT clubs_primary_color_hex CHECK (primary_color IS NULL OR primary_color ~* '^#[0-9a-f]{6}$'),
  ADD CONSTRAINT clubs_accent_color_hex CHECK (accent_color IS NULL OR accent_color ~* '^#[0-9a-f]{6}$');