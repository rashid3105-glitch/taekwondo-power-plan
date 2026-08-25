CREATE OR REPLACE FUNCTION public.stamp_club_id_from_diary_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.club_id IS NULL AND NEW.diary_entry_id IS NOT NULL THEN
    SELECT COALESCE(d.club_id, p.club_id) INTO NEW.club_id
    FROM public.diary_entries d
    LEFT JOIN public.profiles p ON p.user_id = d.user_id
    WHERE d.id = NEW.diary_entry_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS stamp_club_id_weight_logs ON public.weight_logs;
CREATE TRIGGER stamp_club_id_weight_logs
BEFORE INSERT OR UPDATE ON public.weight_logs
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_user();

DROP TRIGGER IF EXISTS stamp_club_id_weight_goals ON public.weight_goals;
CREATE TRIGGER stamp_club_id_weight_goals
BEFORE INSERT OR UPDATE ON public.weight_goals
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_user();

DROP TRIGGER IF EXISTS stamp_club_id_athlete_module_overrides ON public.athlete_module_overrides;
CREATE TRIGGER stamp_club_id_athlete_module_overrides
BEFORE INSERT OR UPDATE ON public.athlete_module_overrides
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_user();

DROP TRIGGER IF EXISTS stamp_club_id_athlete_week_technique_focus ON public.athlete_week_technique_focus;
CREATE TRIGGER stamp_club_id_athlete_week_technique_focus
BEFORE INSERT OR UPDATE ON public.athlete_week_technique_focus
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_athlete();

DROP TRIGGER IF EXISTS stamp_club_id_diary_comments ON public.diary_comments;
CREATE TRIGGER stamp_club_id_diary_comments
BEFORE INSERT OR UPDATE ON public.diary_comments
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_diary_entry();