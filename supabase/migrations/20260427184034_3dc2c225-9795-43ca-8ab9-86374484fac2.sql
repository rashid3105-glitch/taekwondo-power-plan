-- Add wearable-derived metrics to workout logs
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS avg_hr integer,
  ADD COLUMN IF NOT EXISTS max_hr integer,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS calories integer,
  ADD COLUMN IF NOT EXISTS wearable_source text;

-- Coach helper: read 7-day recovery trend for an athlete in their club / managed list.
CREATE OR REPLACE FUNCTION public.get_athlete_recovery_trend(_athlete_id uuid, _days integer DEFAULT 7)
RETURNS TABLE (
  summary_date date,
  sleep_minutes integer,
  resting_hr numeric,
  hrv_rmssd numeric,
  steps integer,
  baseline_hr_7d numeric,
  baseline_hrv_7d numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.summary_date, s.sleep_minutes, s.resting_hr, s.hrv_rmssd,
         s.steps, s.baseline_hr_7d, s.baseline_hrv_7d
  FROM public.wearable_daily_summary s
  WHERE s.user_id = _athlete_id
    AND s.summary_date >= (CURRENT_DATE - GREATEST(_days, 1))
    AND (
      EXISTS (SELECT 1 FROM public.coach_athletes ca
              WHERE ca.coach_id = auth.uid() AND ca.athlete_id = _athlete_id)
      OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), _athlete_id))
      OR auth.uid() = _athlete_id
    )
  ORDER BY s.summary_date ASC
$$;