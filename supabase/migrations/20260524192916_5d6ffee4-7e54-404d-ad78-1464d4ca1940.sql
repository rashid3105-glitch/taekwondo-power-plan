CREATE OR REPLACE FUNCTION public.validate_diary_entry_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.entry_type NOT IN ('general', 'training', 'competition', 'recovery', 'mental', 'injury', 'running') THEN
    RAISE EXCEPTION 'Invalid entry_type: %. Allowed: general, training, competition, recovery, mental, injury, running', NEW.entry_type;
  END IF;
  RETURN NEW;
END;
$function$;