ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_email text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _birth date := NULL;
BEGIN
  BEGIN
    _birth := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date;
  EXCEPTION WHEN others THEN
    _birth := NULL;
  END;

  INSERT INTO public.profiles (user_id, display_name, is_demo, is_approved, birth_date, guardian_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'wants_demo')::boolean, false),
    false,
    _birth,
    NULLIF(NEW.raw_user_meta_data->>'guardian_email','')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;