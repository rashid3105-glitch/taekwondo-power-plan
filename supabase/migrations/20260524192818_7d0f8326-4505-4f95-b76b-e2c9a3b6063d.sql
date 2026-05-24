ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS run_distance_km numeric(6,2),
  ADD COLUMN IF NOT EXISTS run_duration_seconds int,
  ADD COLUMN IF NOT EXISTS run_pace_seconds_per_km int,
  ADD COLUMN IF NOT EXISTS run_calories int;