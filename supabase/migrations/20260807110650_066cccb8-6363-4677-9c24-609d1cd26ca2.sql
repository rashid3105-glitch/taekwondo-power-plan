CREATE OR REPLACE FUNCTION public.get_public_athlete_bundle(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    'club_name', c.name,
    'sport', c.sport
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