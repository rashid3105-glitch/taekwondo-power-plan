-- 1. Add visibility flags to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_show_achievements boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_show_prs boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_show_competitions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_show_videos boolean NOT NULL DEFAULT true;

-- 2. Add result + per-comp public flag to competitions
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 3. Achievements table
CREATE TABLE IF NOT EXISTS public.athlete_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  year integer,
  medal text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.athlete_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements"
  ON public.athlete_achievements
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view achievements when profile is public"
  ON public.athlete_achievements
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = athlete_achievements.user_id
        AND p.is_public = true
        AND p.public_show_achievements = true
    )
  );

CREATE TRIGGER update_athlete_achievements_updated_at
  BEFORE UPDATE ON public.athlete_achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Highlight videos table
CREATE TABLE IF NOT EXISTS public.athlete_highlight_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT video_url_youtube_or_vimeo CHECK (
    url ~* '^https?://(www\.)?(youtube\.com/|youtu\.be/|vimeo\.com/)'
  )
);

ALTER TABLE public.athlete_highlight_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own videos"
  ON public.athlete_highlight_videos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view videos when profile is public"
  ON public.athlete_highlight_videos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = athlete_highlight_videos.user_id
        AND p.is_public = true
        AND p.public_show_videos = true
    )
  );

-- 5. Public profile bundle (security definer; only returns when opted-in)
CREATE OR REPLACE FUNCTION public.get_public_athlete_bundle(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _profile jsonb;
  _achievements jsonb;
  _videos jsonb;
  _competitions jsonb;
  _prs jsonb;
  _show_ach boolean;
  _show_prs boolean;
  _show_comp boolean;
  _show_vid boolean;
BEGIN
  SELECT p.user_id,
         p.public_show_achievements,
         p.public_show_prs,
         p.public_show_competitions,
         p.public_show_videos
    INTO _user_id, _show_ach, _show_prs, _show_comp, _show_vid
  FROM public.profiles p
  WHERE upper(p.athlete_code) = upper(_code)
    AND p.is_public = true
  LIMIT 1;

  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'display_name', p.display_name,
    'athlete_code', p.athlete_code,
    'belt_level', p.belt_level,
    'discipline', p.discipline,
    'country', p.country,
    'avatar_url', p.avatar_url,
    'club_name', c.name
  )
  INTO _profile
  FROM public.profiles p
  LEFT JOIN public.clubs c ON c.id = p.club_id
  WHERE p.user_id = _user_id;

  IF _show_ach THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', a.id, 'title', a.title, 'year', a.year, 'medal', a.medal
    ) ORDER BY a.sort_order, a.year DESC NULLS LAST), '[]'::jsonb)
    INTO _achievements
    FROM public.athlete_achievements a
    WHERE a.user_id = _user_id;
  ELSE
    _achievements := '[]'::jsonb;
  END IF;

  IF _show_vid THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', v.id, 'url', v.url, 'title', v.title
    ) ORDER BY v.sort_order, v.created_at), '[]'::jsonb)
    INTO _videos
    FROM public.athlete_highlight_videos v
    WHERE v.user_id = _user_id;
  ELSE
    _videos := '[]'::jsonb;
  END IF;

  IF _show_comp THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', co.id, 'name', co.name, 'event_date', co.event_date,
      'weight_class_kg', co.weight_class_kg, 'location', co.location, 'result', co.result
    ) ORDER BY co.event_date DESC), '[]'::jsonb)
    INTO _competitions
    FROM public.competitions co
    WHERE co.user_id = _user_id AND co.is_public = true;
  ELSE
    _competitions := '[]'::jsonb;
  END IF;

  IF _show_prs THEN
    -- Take best (highest value) per test_name
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'test_name', t.test_name, 'value', t.value, 'unit', t.unit, 'category', t.category, 'test_date', t.test_date
    ) ORDER BY t.category, t.test_name), '[]'::jsonb)
    INTO _prs
    FROM (
      SELECT DISTINCT ON (test_name)
        test_name, value, unit, category, test_date
      FROM public.physical_test_results
      WHERE user_id = _user_id
      ORDER BY test_name, value DESC, test_date DESC
    ) t;
  ELSE
    _prs := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'profile', _profile,
    'achievements', _achievements,
    'videos', _videos,
    'competitions', _competitions,
    'personal_records', _prs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_athlete_bundle(text) TO anon, authenticated;