
-- Idempotent upsert key for wearable_samples (HealthKit/other providers)
CREATE UNIQUE INDEX IF NOT EXISTS wearable_samples_ext_uniq
  ON public.wearable_samples (user_id, provider, metric_type, external_id)
  WHERE external_id IS NOT NULL;

-- Track HealthKit HKWorkout uuid on workout_logs to avoid duplicate imports
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS workout_logs_wearable_ext_uniq
  ON public.workout_logs (user_id, wearable_source, external_id)
  WHERE wearable_source IS NOT NULL AND external_id IS NOT NULL;
