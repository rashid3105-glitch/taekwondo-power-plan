-- 1) Restrict get_shared_match_video to an allow-list of safe fields
CREATE OR REPLACE FUNCTION public.get_shared_match_video(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'timestamp_seconds', t.timestamp_seconds,
        'technique', t.technique,
        'side', t.side,
        'outcome', t.outcome,
        'notes', t.notes
      )
      ORDER BY t.timestamp_seconds
    ),
    '[]'::jsonb
  ) INTO v_tags
  FROM public.match_tags t
  WHERE t.video_id = v_video.id;

  RETURN jsonb_build_object(
    'video', jsonb_build_object(
      'id', v_video.id,
      'title', v_video.title,
      'notes', v_video.notes,
      'discipline', v_video.discipline,
      'opponent_name', v_video.opponent_name,
      'event_name', v_video.event_name,
      'match_date', v_video.match_date,
      'duration_seconds', v_video.duration_seconds,
      'storage_path', v_video.storage_path
    ),
    'tags', v_tags
  );
END;
$function$;

-- 2) Add explicit deny-by-default policy on webauthn_challenges
-- (RLS enabled, but no policies => no access for anon/authenticated; service role bypasses RLS).
-- Adding an explicit no-op policy documents intent and silences the linter.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
    EXECUTE 'ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='webauthn_challenges'
        AND policyname='No direct client access to webauthn_challenges'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "No direct client access to webauthn_challenges"
        ON public.webauthn_challenges
        AS RESTRICTIVE
        FOR ALL
        TO anon, authenticated
        USING (false)
        WITH CHECK (false)
      $p$;
    END IF;
  END IF;
END $$;