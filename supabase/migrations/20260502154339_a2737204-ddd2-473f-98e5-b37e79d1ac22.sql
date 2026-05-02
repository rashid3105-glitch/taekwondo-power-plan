ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_club_name text,
  ADD COLUMN IF NOT EXISTS coach_athlete_count_band text,
  ADD COLUMN IF NOT EXISTS coach_focus text[];

-- Backfill: any existing user who already filled in their athlete profile is considered onboarded.
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed = false
  AND age IS NOT NULL
  AND belt_level IS NOT NULL
  AND weekly_schedule IS NOT NULL;