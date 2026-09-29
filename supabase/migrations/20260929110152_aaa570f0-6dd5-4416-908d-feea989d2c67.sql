ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS minor_access_without_consent boolean NOT NULL DEFAULT false;

-- Club admins may change the flag only via this function (platform admins also via existing UPDATE policy).
CREATE OR REPLACE FUNCTION public.set_club_minor_access(_club_id uuid, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE club_id = _club_id AND user_id = auth.uid() AND role_in_club = 'admin' AND status = 'active'
  )) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.clubs SET minor_access_without_consent = COALESCE(_enabled, false) WHERE id = _club_id;
END $$;
REVOKE ALL ON FUNCTION public.set_club_minor_access(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_club_minor_access(uuid, boolean) TO authenticated;

-- Read the flag: members/coaches of the club (or platform admin).
CREATE OR REPLACE FUNCTION public.get_club_minor_access(_club_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT c.minor_access_without_consent FROM public.clubs c WHERE c.id = _club_id), false)
  WHERE public.is_admin(auth.uid())
     OR EXISTS (SELECT 1 FROM public.club_memberships m WHERE m.club_id = _club_id AND m.user_id = auth.uid() AND m.status = 'active')
     OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.club_id = _club_id AND p.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_club_minor_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_club_minor_access(uuid) TO authenticated;

-- For the calling athlete: true if at least one of their active clubs allows access.
CREATE OR REPLACE FUNCTION public.my_minor_access_without_consent()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.minor_access_without_consent = true AND c.deleted_at IS NULL
      AND (
        c.id IN (SELECT m.club_id FROM public.club_memberships m WHERE m.user_id = auth.uid() AND m.status = 'active')
        OR c.id IN (SELECT p.club_id FROM public.profiles p WHERE p.user_id = auth.uid())
      )
  );
$$;
REVOKE ALL ON FUNCTION public.my_minor_access_without_consent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_minor_access_without_consent() TO authenticated;