ALTER TABLE public.taekwondo_drills RENAME TO club_drills;

DELETE FROM public.club_drills WHERE club_id IS NULL;

ALTER TABLE public.club_drills ALTER COLUMN club_id SET NOT NULL;

ALTER TABLE public.club_drills
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

ALTER TABLE public.club_drills
  ADD CONSTRAINT club_drills_source_check CHECK (source IN ('youtube','upload'));

ALTER TABLE public.club_drills
  ADD CONSTRAINT club_drills_size_check CHECK (file_size_bytes IS NULL OR file_size_bytes <= 10485760);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_drills TO authenticated;
GRANT ALL ON public.club_drills TO service_role;

ALTER TABLE public.club_drills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins delete drills" ON public.club_drills;
DROP POLICY IF EXISTS "Admins insert drills" ON public.club_drills;
DROP POLICY IF EXISTS "Admins read all drills" ON public.club_drills;
DROP POLICY IF EXISTS "Admins update drills" ON public.club_drills;
DROP POLICY IF EXISTS "Members read global and own club active drills" ON public.club_drills;

CREATE POLICY "Club members read club drills"
ON public.club_drills FOR SELECT TO authenticated
USING (public.is_member_of_club(club_id) OR public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Club coaches insert club drills"
ON public.club_drills FOR INSERT TO authenticated
WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Club coaches update club drills"
ON public.club_drills FOR UPDATE TO authenticated
USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()))
WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Club coaches delete club drills"
ON public.club_drills FOR DELETE TO authenticated
USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_club_drill_upload_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  IF NEW.source = 'upload' THEN
    SELECT count(*) INTO cnt
    FROM public.club_drills
    WHERE club_id = NEW.club_id AND source = 'upload' AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF cnt >= 5 THEN
      RAISE EXCEPTION 'Upload quota reached: max 5 uploaded videos per club';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_drill_upload_quota ON public.club_drills;
CREATE TRIGGER trg_club_drill_upload_quota
BEFORE INSERT OR UPDATE ON public.club_drills
FOR EACH ROW EXECUTE FUNCTION public.enforce_club_drill_upload_quota();

DROP TRIGGER IF EXISTS update_club_drills_updated_at ON public.club_drills;
CREATE TRIGGER update_club_drills_updated_at
BEFORE UPDATE ON public.club_drills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();