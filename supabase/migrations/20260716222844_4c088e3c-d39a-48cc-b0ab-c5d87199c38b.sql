ALTER TABLE public.wearable_samples DROP CONSTRAINT wearable_samples_metric_type_check;
ALTER TABLE public.wearable_samples ADD CONSTRAINT wearable_samples_metric_type_check
  CHECK (metric_type = ANY (ARRAY['sleep'::text, 'resting_hr'::text, 'hrv'::text, 'steps'::text, 'workout'::text, 'heart_rate'::text, 'active_energy'::text]));