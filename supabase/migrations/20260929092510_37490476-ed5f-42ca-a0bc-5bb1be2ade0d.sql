CREATE TABLE public.diary_entry_health (
  entry_id uuid PRIMARY KEY REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mood integer NULL,
  energy integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_diary_entry_health_user ON public.diary_entry_health(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entry_health TO authenticated;
GRANT ALL ON public.diary_entry_health TO service_role;
ALTER TABLE public.diary_entry_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own health rows read" ON public.diary_entry_health FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Own health rows insert with consent" ON public.diary_entry_health FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_health_consent(user_id)
    AND EXISTS (SELECT 1 FROM public.diary_entries d WHERE d.id = entry_id AND d.user_id = auth.uid()));
CREATE POLICY "Own health rows update with consent" ON public.diary_entry_health FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.has_health_consent(user_id));
CREATE POLICY "Own health rows delete" ON public.diary_entry_health FOR DELETE TO authenticated
  USING (user_id = auth.uid());
-- Coach: the EXISTS runs under the caller's diary_entries RLS, so it grants exactly
-- the same entry access as the diary itself (club coach, not private), plus consent.
CREATE POLICY "Coach reads health rows with consent" ON public.diary_entry_health FOR SELECT TO authenticated
  USING (user_id <> auth.uid() AND public.has_health_consent(user_id)
    AND EXISTS (SELECT 1 FROM public.diary_entries d WHERE d.id = entry_id AND COALESCE(d.is_private,false) = false));

CREATE TRIGGER update_diary_entry_health_updated_at BEFORE UPDATE ON public.diary_entry_health
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Copy only for athletes with consent; the rest is discarded.
INSERT INTO public.diary_entry_health (entry_id, user_id, mood, energy, created_at)
SELECT id, user_id, mood, energy, created_at FROM public.diary_entries
WHERE (mood IS NOT NULL OR energy IS NOT NULL) AND public.has_health_consent(user_id);

-- Functions that read mood/energy must be rewritten before the columns go.
CREATE OR REPLACE FUNCTION public.diary_health_fields(_entry_ids uuid[])
 RETURNS TABLE(id uuid, mood integer, energy integer)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT h.entry_id,
         CASE WHEN h.user_id = auth.uid() OR public.has_health_consent(h.user_id) THEN h.mood END,
         CASE WHEN h.user_id = auth.uid() OR public.has_health_consent(h.user_id) THEN h.energy END
  FROM public.diary_entry_health h
  WHERE h.entry_id = ANY(_entry_ids)
$$;

CREATE OR REPLACE FUNCTION public.compute_form_curve(_user_id uuid, _weeks integer DEFAULT 12)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_week_start DATE; v_load NUMERIC; v_strain NUMERIC; v_output NUMERIC; v_composite NUMERIC;
  v_prev_load NUMERIC := 0; v_prev_strain NUMERIC := 0; v_overtraining BOOLEAN;
  v_consecutive_high INT := 0; v_club_id UUID; v_consent BOOLEAN;
BEGIN
  SELECT club_id INTO v_club_id FROM public.profiles WHERE user_id = _user_id;
  IF v_club_id IS NULL THEN
    SELECT club_id INTO v_club_id FROM public.club_memberships
    WHERE user_id = _user_id AND status = 'active' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_club_id IS NULL THEN RETURN; END IF;
  v_consent := COALESCE(public.has_health_consent(_user_id), false);
  FOR i IN REVERSE (_weeks - 1)..0 LOOP
    v_week_start := date_trunc('week', (now() - (i || ' weeks')::interval))::date;
    SELECT COALESCE(COUNT(*) * 30, 0)::numeric INTO v_load FROM public.workout_logs
    WHERE user_id = _user_id AND completed = true
      AND logged_date >= v_week_start AND logged_date < v_week_start + INTERVAL '7 days';
    IF v_consent THEN
      SELECT COALESCE(
        (SELECT AVG(10 - score) FROM public.readiness_checkins
          WHERE user_id = _user_id AND checkin_date >= v_week_start
          AND checkin_date < v_week_start + INTERVAL '7 days'), 0
      ) + COALESCE(
        (SELECT AVG((5 - h.mood) + (5 - h.energy)) FROM public.diary_entry_health h
          JOIN public.diary_entries d ON d.id = h.entry_id
          WHERE d.user_id = _user_id AND COALESCE(d.is_private, false) = false
          AND d.entry_date >= v_week_start AND d.entry_date < v_week_start + INTERVAL '7 days'), 0
      ) INTO v_strain;
    ELSE
      v_strain := 0;
    END IF;
    SELECT COALESCE(COUNT(*) * 10, 0)::numeric INTO v_output FROM public.physical_test_results
    WHERE user_id = _user_id AND test_date >= v_week_start AND test_date < v_week_start + INTERVAL '7 days';
    v_composite := LEAST(100, GREATEST(0, (v_load * 0.5) + (v_output * 1.5) - (v_strain * 2.0) + 50));
    IF v_load > v_prev_load * 1.2 AND v_strain > v_prev_strain * 1.2 AND v_strain > 5 THEN
      v_consecutive_high := v_consecutive_high + 1;
    ELSE v_consecutive_high := 0; END IF;
    v_overtraining := v_consecutive_high >= 2;
    INSERT INTO public.form_curve_weekly (user_id, week_start, load, strain, output, composite_score, overtraining_flag, computed_at, club_id)
    VALUES (_user_id, v_week_start, v_load, v_strain, v_output, v_composite, v_overtraining, now(), v_club_id)
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      load = EXCLUDED.load, strain = EXCLUDED.strain, output = EXCLUDED.output,
      composite_score = EXCLUDED.composite_score, overtraining_flag = EXCLUDED.overtraining_flag,
      computed_at = now(), club_id = COALESCE(EXCLUDED.club_id, public.form_curve_weekly.club_id);
    v_prev_load := v_load; v_prev_strain := v_strain;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_squad_overview(_coach_id uuid, _club_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH guard AS (
    SELECT (auth.uid() IS NOT NULL AND auth.uid() = _coach_id AND has_role(_coach_id, 'coach'::app_role)) AS ok
  ),
  athletes AS (
    SELECT ca.athlete_id AS user_id
    FROM public.coach_athletes ca, guard
    WHERE guard.ok AND ca.coach_id = _coach_id AND (_club_id IS NULL OR ca.club_id = _club_id)
    UNION
    SELECT m2.user_id
    FROM public.club_memberships m1
    JOIN public.club_memberships m2 ON m1.club_id = m2.club_id, guard
    WHERE guard.ok AND m1.user_id = _coach_id AND m1.status = 'active' AND m2.status = 'active'
      AND m2.user_id <> _coach_id AND (_club_id IS NULL OR m1.club_id = _club_id)
  ),
  consent AS (
    SELECT user_id, COALESCE(public.has_health_consent(user_id), false) AS ok FROM athletes
  ),
  latest_readiness AS (
    SELECT DISTINCT ON (r.user_id) r.user_id, r.score, r.checkin_date FROM public.readiness_checkins r
    JOIN consent c ON c.user_id = r.user_id AND c.ok
    ORDER BY r.user_id, r.checkin_date DESC, r.created_at DESC
  ),
  latest_mood AS (
    SELECT DISTINCT ON (d.user_id) d.user_id, h.mood, h.energy, d.entry_date
    FROM public.diary_entry_health h
    JOIN public.diary_entries d ON d.id = h.entry_id
    JOIN consent c ON c.user_id = d.user_id AND c.ok
    WHERE COALESCE(d.is_private, false) = false
    ORDER BY d.user_id, d.entry_date DESC, d.created_at DESC
  ),
  sessions_7d AS (
    SELECT user_id, COUNT(DISTINCT logged_date) AS sessions_logged FROM public.workout_logs
    WHERE user_id IN (SELECT user_id FROM athletes) AND completed = true
      AND logged_date >= (CURRENT_DATE - 7) GROUP BY user_id
  ),
  active_plan AS (
    SELECT DISTINCT user_id FROM public.training_plans
    WHERE is_active = true AND user_id IN (SELECT user_id FROM athletes)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', p.user_id, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'belt_level', p.belt_level, 'athlete_code', p.athlete_code,
    'sessions_per_week', p.sessions_per_week, 'last_seen_at', p.last_seen_at,
    'consent_missing', NOT c.ok,
    'has_active_injury', CASE WHEN c.ok THEN (p.current_injury IS NOT NULL AND length(trim(p.current_injury)) > 0) ELSE NULL END,
    'has_active_plan', (ap.user_id IS NOT NULL),
    'latest_readiness_score', lr.score, 'latest_readiness_date', lr.checkin_date,
    'latest_mood', lm.mood, 'latest_energy', lm.energy, 'latest_diary_date', lm.entry_date,
    'sessions_logged_7d', COALESCE(s7.sessions_logged, 0),
    'planned_sessions_7d', p.sessions_per_week
  ) ORDER BY p.display_name), '[]'::jsonb)
  FROM athletes a
  JOIN consent c ON c.user_id = a.user_id
  JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN latest_readiness lr ON lr.user_id = p.user_id
  LEFT JOIN latest_mood lm ON lm.user_id = p.user_id
  LEFT JOIN sessions_7d s7 ON s7.user_id = p.user_id
  LEFT JOIN active_plan ap ON ap.user_id = p.user_id
$function$;

DROP TRIGGER IF EXISTS trg_strip_diary_health_without_consent ON public.diary_entries;
DROP FUNCTION IF EXISTS public.strip_diary_health_without_consent();
ALTER TABLE public.diary_entries DROP COLUMN mood, DROP COLUMN energy;