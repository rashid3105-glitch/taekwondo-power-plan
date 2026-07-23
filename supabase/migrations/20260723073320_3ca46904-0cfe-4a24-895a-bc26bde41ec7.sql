CREATE UNIQUE INDEX IF NOT EXISTS workout_logs_user_source_external_uidx
  ON public.workout_logs (user_id, wearable_source, external_id);