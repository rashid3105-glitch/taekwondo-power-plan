-- 1. Diary: strip mood/energy without health-data consent
CREATE OR REPLACE FUNCTION public.strip_diary_health_without_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.mood IS NOT NULL OR NEW.energy IS NOT NULL)
     AND NOT public.has_health_consent(NEW.user_id) THEN
    NEW.mood := NULL;
    NEW.energy := NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.strip_diary_health_without_consent() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_strip_diary_health_without_consent ON public.diary_entries;
CREATE TRIGGER trg_strip_diary_health_without_consent
  BEFORE INSERT OR UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.strip_diary_health_without_consent();

-- 3. Coach view of mood/energy: invoker function (normal RLS decides which
--    entries are visible), masks values when the athlete has no consent.
CREATE OR REPLACE FUNCTION public.diary_health_fields(_entry_ids uuid[])
RETURNS TABLE(id uuid, mood integer, energy integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT d.id,
         CASE WHEN d.user_id = auth.uid() OR public.has_health_consent(d.user_id) THEN d.mood END,
         CASE WHEN d.user_id = auth.uid() OR public.has_health_consent(d.user_id) THEN d.energy END
  FROM public.diary_entries d
  WHERE d.id = ANY(_entry_ids)
$$;
REVOKE EXECUTE ON FUNCTION public.diary_health_fields(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.diary_health_fields(uuid[]) TO authenticated;

-- 4a. readiness_checkins
DROP POLICY IF EXISTS "Users manage own readiness" ON public.readiness_checkins;
CREATE POLICY "Users read own readiness" ON public.readiness_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own readiness with consent" ON public.readiness_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_health_consent(user_id));
CREATE POLICY "Users update own readiness with consent" ON public.readiness_checkins
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_health_consent(user_id));
CREATE POLICY "Users delete own readiness" ON public.readiness_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Coaches read club readiness_checkins v3" ON public.readiness_checkins;
CREATE POLICY "Coaches read club readiness_checkins v4" ON public.readiness_checkins
  FOR SELECT USING (
    (((club_id IS NOT NULL) AND is_coach_of_club(club_id)) OR ((club_id IS NULL) AND is_coach_of_athletes_club(user_id)))
    AND public.has_health_consent(user_id));

-- 4b. weight_logs
DROP POLICY IF EXISTS "Users manage own weight logs" ON public.weight_logs;
CREATE POLICY "Users read own weight logs" ON public.weight_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own weight logs with consent" ON public.weight_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_health_consent(user_id));
CREATE POLICY "Users update own weight logs with consent" ON public.weight_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_health_consent(user_id));
CREATE POLICY "Users delete own weight logs" ON public.weight_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches read club weight_logs v2" ON public.weight_logs;
CREATE POLICY "Coaches read club weight_logs v3" ON public.weight_logs
  FOR SELECT USING (
    (((club_id IS NOT NULL) AND is_coach_of_club(club_id)) OR ((club_id IS NULL) AND ((EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id)) OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), user_id)))))
    AND public.has_health_consent(user_id));
DROP POLICY IF EXISTS "Coaches insert weight logs for managed athletes" ON public.weight_logs;
CREATE POLICY "Coaches insert weight logs for managed athletes with consent" ON public.weight_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id)
    AND public.has_health_consent(user_id));
DROP POLICY IF EXISTS "Coaches update weight logs for managed athletes" ON public.weight_logs;
CREATE POLICY "Coaches update weight logs for managed athletes with consent" ON public.weight_logs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id))
  WITH CHECK (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id)
    AND public.has_health_consent(user_id));