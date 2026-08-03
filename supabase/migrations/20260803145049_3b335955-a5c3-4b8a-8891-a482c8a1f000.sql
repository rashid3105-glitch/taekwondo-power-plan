ALTER TABLE public.weight_goals
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS motivations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS challenges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;