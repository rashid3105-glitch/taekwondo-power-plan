CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Exempt 1: service-role connections (e.g. the update-my-profile edge function).
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Exempt 2: platform admins acting through the client.
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Everyone else: silently revert protected fields to their previous value.
  NEW.gal_license            := OLD.gal_license;
  NEW.gal_license_expires_at := OLD.gal_license_expires_at;
  NEW.has_myfightbook        := OLD.has_myfightbook;
  NEW.myfightbook_expires_at := OLD.myfightbook_expires_at;
  NEW.license_values         := OLD.license_values;
  NEW.superadmin_active      := OLD.superadmin_active;
  NEW.role                   := OLD.role;
  NEW.roles                  := OLD.roles;
  NEW.athlete_code           := OLD.athlete_code;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;

CREATE TRIGGER protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();