ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tkd_start_date date,
  ADD COLUMN IF NOT EXISTS birth_date date;