
-- ============================================================
-- FEATURE 1: MATCH ANALYSIS
-- ============================================================

-- Match videos table
CREATE TABLE public.match_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  club_id UUID,
  title TEXT NOT NULL DEFAULT 'Untitled',
  notes TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  discipline TEXT NOT NULL DEFAULT 'sparring' CHECK (discipline IN ('sparring', 'poomsae')),
  opponent_name TEXT,
  event_name TEXT,
  match_date DATE,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_videos_athlete ON public.match_videos(athlete_id);
CREATE INDEX idx_match_videos_coach ON public.match_videos(coach_id);
CREATE INDEX idx_match_videos_club ON public.match_videos(club_id);
CREATE INDEX idx_match_videos_share_token ON public.match_videos(share_token) WHERE share_token IS NOT NULL;

ALTER TABLE public.match_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage own match videos"
ON public.match_videos
FOR ALL
TO authenticated
USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Athlete can view own match videos"
ON public.match_videos
FOR SELECT
TO authenticated
USING (auth.uid() = athlete_id);

CREATE POLICY "Club coaches can view match videos"
ON public.match_videos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND users_share_club(auth.uid(), athlete_id)
);

CREATE TRIGGER update_match_videos_updated_at
BEFORE UPDATE ON public.match_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Match tags table
CREATE TABLE public.match_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.match_videos(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  technique TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'n/a' CHECK (side IN ('left', 'right', 'n/a')),
  outcome TEXT NOT NULL DEFAULT 'none' CHECK (outcome IN ('scored', 'conceded', 'penalty', 'none')),
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_tags_video ON public.match_tags(video_id);

ALTER TABLE public.match_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage tags on own videos"
ON public.match_tags
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.match_videos v
          WHERE v.id = match_tags.video_id AND v.coach_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.match_videos v
          WHERE v.id = match_tags.video_id AND v.coach_id = auth.uid())
);

CREATE POLICY "Athlete can view tags on own videos"
ON public.match_tags
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.match_videos v
          WHERE v.id = match_tags.video_id AND v.athlete_id = auth.uid())
);

CREATE POLICY "Club coaches can view tags on club videos"
ON public.match_tags
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.match_videos v
    WHERE v.id = match_tags.video_id
    AND users_share_club(auth.uid(), v.athlete_id)
  )
);

-- Storage bucket for match videos (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match_videos',
  'match_videos',
  false,
  209715200, -- 200 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
);

-- Storage RLS: coach who owns the path can write; coach + athlete + club coaches can read
CREATE POLICY "Coaches can upload match videos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'match_videos'
  AND has_role(auth.uid(), 'coach'::app_role)
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can update own match video files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'match_videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can delete own match video files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'match_videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Match video readers can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'match_videos'
  AND EXISTS (
    SELECT 1 FROM public.match_videos v
    WHERE v.storage_path = name
    AND (
      v.coach_id = auth.uid()
      OR v.athlete_id = auth.uid()
      OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), v.athlete_id))
    )
  )
);

-- Public token-based viewer RPC
CREATE OR REPLACE FUNCTION public.get_shared_match_video(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_video public.match_videos;
  v_tags JSONB;
BEGIN
  SELECT * INTO v_video
  FROM public.match_videos
  WHERE share_token = _token
    AND share_expires_at IS NOT NULL
    AND share_expires_at > now();

  IF v_video.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.timestamp_seconds), '[]'::jsonb) INTO v_tags
  FROM public.match_tags t
  WHERE t.video_id = v_video.id;

  RETURN jsonb_build_object(
    'video', to_jsonb(v_video),
    'tags', v_tags
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_match_video(TEXT) TO anon, authenticated;

-- ============================================================
-- FEATURE 2: PERFORMANCE INTELLIGENCE
-- ============================================================

-- Form curve weekly composite
CREATE TABLE public.form_curve_weekly (
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  load NUMERIC NOT NULL DEFAULT 0,
  strain NUMERIC NOT NULL DEFAULT 0,
  output NUMERIC NOT NULL DEFAULT 0,
  composite_score NUMERIC NOT NULL DEFAULT 0,
  overtraining_flag BOOLEAN NOT NULL DEFAULT false,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

CREATE INDEX idx_form_curve_user_week ON public.form_curve_weekly(user_id, week_start DESC);

ALTER TABLE public.form_curve_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes view own form curve"
ON public.form_curve_weekly
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete form curve"
ON public.form_curve_weekly
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() AND ca.athlete_id = form_curve_weekly.user_id
  )
  OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), user_id))
);

-- Add weekly digest opt-out toggle
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN NOT NULL DEFAULT true;

-- Recompute form curve for a single athlete (last N weeks)
CREATE OR REPLACE FUNCTION public.compute_form_curve(_user_id UUID, _weeks INTEGER DEFAULT 12)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_load NUMERIC;
  v_strain NUMERIC;
  v_output NUMERIC;
  v_composite NUMERIC;
  v_prev_load NUMERIC := 0;
  v_prev_strain NUMERIC := 0;
  v_overtraining BOOLEAN;
  v_consecutive_high INT := 0;
BEGIN
  -- Iterate weeks oldest -> newest
  FOR i IN REVERSE (_weeks - 1)..0 LOOP
    v_week_start := date_trunc('week', (now() - (i || ' weeks')::interval))::date;

    -- LOAD: completed workout_logs in week, weighted ~30 min/exercise
    SELECT COALESCE(COUNT(*) * 30, 0)::numeric INTO v_load
    FROM public.workout_logs
    WHERE user_id = _user_id
      AND completed = true
      AND logged_date >= v_week_start
      AND logged_date < v_week_start + INTERVAL '7 days';

    -- STRAIN: avg of (10-readiness.score) + (5-mood) + (5-energy) from readiness + diary
    SELECT COALESCE(
      (SELECT AVG(10 - score) FROM public.readiness_checkins
        WHERE user_id = _user_id
        AND checkin_date >= v_week_start
        AND checkin_date < v_week_start + INTERVAL '7 days'),
      0
    ) + COALESCE(
      (SELECT AVG((5 - mood) + (5 - energy)) FROM public.diary_entries
        WHERE user_id = _user_id
        AND entry_date >= v_week_start
        AND entry_date < v_week_start + INTERVAL '7 days'),
      0
    ) INTO v_strain;

    -- OUTPUT: count of new test records this week (proxy for active testing/PRs)
    SELECT COALESCE(COUNT(*) * 10, 0)::numeric INTO v_output
    FROM public.physical_test_results
    WHERE user_id = _user_id
      AND test_date >= v_week_start
      AND test_date < v_week_start + INTERVAL '7 days';

    -- Composite: weighted blend, normalize to ~0-100
    v_composite := LEAST(100, GREATEST(0,
      (v_load * 0.5) + (v_output * 1.5) - (v_strain * 2.0) + 50
    ));

    -- Overtraining: load and strain both elevated week-over-week for 2+ weeks
    IF v_load > v_prev_load * 1.2 AND v_strain > v_prev_strain * 1.2 AND v_strain > 5 THEN
      v_consecutive_high := v_consecutive_high + 1;
    ELSE
      v_consecutive_high := 0;
    END IF;
    v_overtraining := v_consecutive_high >= 2;

    INSERT INTO public.form_curve_weekly (
      user_id, week_start, load, strain, output, composite_score, overtraining_flag, computed_at
    ) VALUES (
      _user_id, v_week_start, v_load, v_strain, v_output, v_composite, v_overtraining, now()
    )
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      load = EXCLUDED.load,
      strain = EXCLUDED.strain,
      output = EXCLUDED.output,
      composite_score = EXCLUDED.composite_score,
      overtraining_flag = EXCLUDED.overtraining_flag,
      computed_at = now();

    v_prev_load := v_load;
    v_prev_strain := v_strain;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_form_curve(UUID, INTEGER) TO authenticated;
