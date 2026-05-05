ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gal_license TEXT,
  ADD COLUMN IF NOT EXISTS gal_license_expires_at DATE,
  ADD COLUMN IF NOT EXISTS has_myfightbook BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS myfightbook_expires_at DATE;