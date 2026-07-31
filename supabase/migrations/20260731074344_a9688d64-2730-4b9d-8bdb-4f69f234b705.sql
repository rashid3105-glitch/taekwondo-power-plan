CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rows jsonb;
  v_summary jsonb;
  v_signups jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  WITH base AS (
    SELECT
      p.user_id,
      COALESCE(p.display_name, '') AS display_name,
      p.club_id,
      c.name AS club_name,
      p.country,
      p.is_approved,
      p.is_demo,
      p.demo_expires_at,
      p.payment_status,
      p.is_parent,
      p.created_at,
      p.last_seen_at,
      public.has_role(p.user_id, 'admin'::app_role) AS is_admin,
      (public.has_role(p.user_id, 'coach'::app_role)
        OR p.role = 'coach'
        OR COALESCE(p.roles, '{}') @> ARRAY['coach']) AS is_coach,
      (SELECT COUNT(*) FROM public.diary_entries d WHERE d.user_id = p.user_id) AS diary_count,
      (SELECT COUNT(*) FROM public.workout_logs w WHERE w.user_id = p.user_id) AS workout_count,
      (SELECT COUNT(*) FROM public.physical_test_results t WHERE t.user_id = p.user_id) AS test_count,
      (SELECT COUNT(*) FROM public.competitions co WHERE co.user_id = p.user_id) AS competition_count,
      GREATEST(
        COALESCE(p.last_seen_at, 'epoch'::timestamptz),
        COALESCE((SELECT MAX(d.created_at) FROM public.diary_entries d WHERE d.user_id = p.user_id), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(w.created_at) FROM public.workout_logs w WHERE w.user_id = p.user_id), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(r.created_at) FROM public.readiness_checkins r WHERE r.user_id = p.user_id), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(m.created_at) FROM public.chat_messages m WHERE m.sender_id = p.user_id), 'epoch'::timestamptz)
      ) AS last_activity_raw
    FROM public.profiles p
    LEFT JOIN public.clubs c ON c.id = p.club_id
  ),
  rows AS (
    SELECT b.*,
      NULLIF(b.last_activity_raw, 'epoch'::timestamptz) AS last_activity_at
    FROM base b
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'user_id', r.user_id,
      'display_name', r.display_name,
      'club_id', r.club_id,
      'club_name', r.club_name,
      'country', r.country,
      'is_approved', r.is_approved,
      'is_demo', r.is_demo,
      'demo_expires_at', r.demo_expires_at,
      'payment_status', r.payment_status,
      'role', CASE WHEN r.is_admin THEN 'admin'
                   WHEN r.is_coach THEN 'coach'
                   WHEN r.is_parent THEN 'parent'
                   ELSE 'athlete' END,
      'created_at', r.created_at,
      'last_activity_at', r.last_activity_at,
      'diary_count', r.diary_count,
      'workout_count', r.workout_count,
      'test_count', r.test_count,
      'competition_count', r.competition_count
    ) ORDER BY r.created_at DESC), '[]'::jsonb),
    jsonb_build_object(
      'total', COUNT(*),
      'active_7d', COUNT(*) FILTER (WHERE r.last_activity_at > now() - interval '7 days'),
      'active_30d', COUNT(*) FILTER (WHERE r.last_activity_at > now() - interval '30 days'),
      'inactive_30d', COUNT(*) FILTER (WHERE r.last_activity_at IS NULL OR r.last_activity_at <= now() - interval '30 days'),
      'new_this_month', COUNT(*) FILTER (WHERE r.created_at >= date_trunc('month', now())),
      'new_prev_month', COUNT(*) FILTER (WHERE r.created_at >= date_trunc('month', now()) - interval '1 month' AND r.created_at < date_trunc('month', now())),
      'approved', COUNT(*) FILTER (WHERE r.is_approved),
      'pending', COUNT(*) FILTER (WHERE NOT r.is_approved),
      'paid', COUNT(*) FILTER (WHERE r.payment_status = 'paid'),
      'demo', COUNT(*) FILTER (WHERE r.is_demo AND r.payment_status IS DISTINCT FROM 'paid'),
      'unpaid', COUNT(*) FILTER (WHERE r.payment_status IS DISTINCT FROM 'paid' AND NOT COALESCE(r.is_demo, false)),
      'athletes', COUNT(*) FILTER (WHERE NOT r.is_admin AND NOT r.is_coach AND NOT COALESCE(r.is_parent, false)),
      'coaches', COUNT(*) FILTER (WHERE r.is_coach AND NOT r.is_admin),
      'parents', COUNT(*) FILTER (WHERE COALESCE(r.is_parent, false) AND NOT r.is_admin AND NOT r.is_coach),
      'admins', COUNT(*) FILTER (WHERE r.is_admin),
      'no_club', COUNT(*) FILTER (WHERE r.club_id IS NULL)
    )
  INTO v_rows, v_summary
  FROM rows r;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('month', to_char(m.month, 'YYYY-MM'), 'count', m.cnt) ORDER BY m.month), '[]'::jsonb)
  INTO v_signups
  FROM (
    SELECT date_trunc('month', gs)::date AS month,
      (SELECT COUNT(*) FROM public.profiles p
        WHERE p.created_at >= date_trunc('month', gs)
          AND p.created_at < date_trunc('month', gs) + interval '1 month') AS cnt
    FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') gs
  ) m;

  RETURN jsonb_build_object(
    'summary', v_summary || jsonb_build_object(
      'clubs', (SELECT COUNT(*) FROM public.clubs WHERE deleted_at IS NULL)
    ),
    'signups_by_month', v_signups,
    'users', v_rows
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;