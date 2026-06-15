CREATE OR REPLACE FUNCTION public.stamp_diary_club_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    SELECT club_id INTO NEW.club_id
    FROM public.profiles
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS diary_entries_stamp_club_id ON public.diary_entries;

CREATE TRIGGER diary_entries_stamp_club_id
BEFORE INSERT ON public.diary_entries
FOR EACH ROW EXECUTE FUNCTION public.stamp_diary_club_id();