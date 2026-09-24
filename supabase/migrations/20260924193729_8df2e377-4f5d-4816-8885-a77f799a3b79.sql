ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS license_active_before_deactivation boolean;

CREATE OR REPLACE FUNCTION public.admin_deactivate_club(_club_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _members int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT count(*) INTO _members FROM public.club_memberships WHERE club_id = _club_id AND status = 'active';
  UPDATE public.clubs
     SET license_active_before_deactivation = CASE WHEN deleted_at IS NULL THEN license_active ELSE license_active_before_deactivation END,
         deleted_at = COALESCE(deleted_at, now()),
         deactivated_by = auth.uid(),
         license_active = false
   WHERE id = _club_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'club_not_found'; END IF;
  RETURN jsonb_build_object('ok', true, 'active_members', _members);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_club(_club_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.clubs
     SET license_active = CASE WHEN deleted_at IS NOT NULL THEN COALESCE(license_active_before_deactivation, license_active) ELSE license_active END,
         license_active_before_deactivation = NULL,
         deleted_at = NULL,
         deactivated_by = NULL
   WHERE id = _club_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'club_not_found'; END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_club_delete_grace()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.deleted_at IS NULL OR OLD.deleted_at > now() - interval '30 days' THEN
    RAISE EXCEPTION 'grace_period_not_elapsed';
  END IF;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_enforce_club_delete_grace ON public.clubs;
CREATE TRIGGER trg_enforce_club_delete_grace BEFORE DELETE ON public.clubs
FOR EACH ROW EXECUTE FUNCTION public.enforce_club_delete_grace();