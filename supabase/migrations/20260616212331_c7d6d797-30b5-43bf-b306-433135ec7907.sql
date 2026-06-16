
-- =====================================================================
-- A) ADD club_id WHERE MISSING
-- =====================================================================

ALTER TABLE public.workout_logs        ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);
ALTER TABLE public.nutrition_plans     ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);
ALTER TABLE public.session_attendance  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);
ALTER TABLE public.workout_log_feedback ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);

CREATE INDEX IF NOT EXISTS idx_workout_logs_club_id        ON public.workout_logs(club_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_club_id     ON public.nutrition_plans(club_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_club_id  ON public.session_attendance(club_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_feedback_club_id ON public.workout_log_feedback(club_id);

-- =====================================================================
-- B) BACKFILL club_id FROM ATHLETE'S PRIMARY profiles.club_id
--    (best-effort for historical rows)
-- =====================================================================

UPDATE public.workout_logs t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.nutrition_plans t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.session_attendance t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.athlete_id AND p.club_id IS NOT NULL;

UPDATE public.workout_log_feedback t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.athlete_id AND p.club_id IS NOT NULL;

UPDATE public.readiness_checkins t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.physical_test_results t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.competitions t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.competition_reflections t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.training_plans t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.rehab_plans t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.health_data t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.wearable_daily_summary t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.mental_assessments t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

UPDATE public.event_reminders t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.athlete_id AND p.club_id IS NOT NULL;

UPDATE public.coach_athlete_notes t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.athlete_id AND p.club_id IS NOT NULL;

-- Diary stamping already exists; refill any historical nulls too
UPDATE public.diary_entries t SET club_id = p.club_id
  FROM public.profiles p WHERE t.club_id IS NULL AND p.user_id = t.user_id AND p.club_id IS NOT NULL;

-- =====================================================================
-- C) GENERIC STAMP FUNCTIONS + TRIGGERS
-- =====================================================================

-- User-column based stamper (user_id)
CREATE OR REPLACE FUNCTION public.stamp_club_id_from_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.club_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT club_id INTO NEW.club_id FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;

-- Athlete-column based stamper (athlete_id)
CREATE OR REPLACE FUNCTION public.stamp_club_id_from_athlete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.club_id IS NULL AND NEW.athlete_id IS NOT NULL THEN
    SELECT club_id INTO NEW.club_id FROM public.profiles WHERE user_id = NEW.athlete_id;
  END IF;
  RETURN NEW;
END $$;

-- Attach triggers (DROP first for idempotency)
DO $$
DECLARE
  user_tables  text[] := ARRAY['workout_logs','nutrition_plans','readiness_checkins','physical_test_results','competitions','competition_reflections','training_plans','rehab_plans','health_data','wearable_daily_summary','mental_assessments'];
  ath_tables   text[] := ARRAY['session_attendance','workout_log_feedback','event_reminders','coach_athlete_notes'];
  t text;
BEGIN
  FOREACH t IN ARRAY user_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS stamp_club_id_trg ON public.%I', t);
    EXECUTE format('CREATE TRIGGER stamp_club_id_trg BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_user()', t);
  END LOOP;
  FOREACH t IN ARRAY ath_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS stamp_club_id_trg ON public.%I', t);
    EXECUTE format('CREATE TRIGGER stamp_club_id_trg BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_athlete()', t);
  END LOOP;
END $$;

-- Re-attach diary stamper explicitly (function already exists)
DROP TRIGGER IF EXISTS stamp_club_id_trg ON public.diary_entries;
CREATE TRIGGER stamp_club_id_trg BEFORE INSERT ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.stamp_diary_club_id();

-- =====================================================================
-- D) TIGHTEN POLICIES — replace cross-club coach access with strict
--    is_coach_of_club(club_id). For NULL legacy rows (should be none
--    after backfill), fall back to is_coach_of_athletes_club().
-- =====================================================================

-- Helper for the per-table coach SELECT clause:
--   ((club_id IS NOT NULL AND is_coach_of_club(club_id))
--    OR (club_id IS NULL AND is_coach_of_athletes_club(<athlete_col>)))

----- workout_logs -----
DROP POLICY IF EXISTS "Coaches read club workout_logs v2" ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches view linked athletes workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches can view athlete workout logs" ON public.workout_logs;
CREATE POLICY "Coaches read club workout_logs v3" ON public.workout_logs
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- nutrition_plans -----
DROP POLICY IF EXISTS "Coaches can view athlete nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Coaches read club nutrition_plans v3" ON public.nutrition_plans
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- readiness_checkins -----
DROP POLICY IF EXISTS "Coaches read club readiness_checkins v2" ON public.readiness_checkins;
CREATE POLICY "Coaches read club readiness_checkins v3" ON public.readiness_checkins
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- physical_test_results -----
DROP POLICY IF EXISTS "Coaches can view athlete test results" ON public.physical_test_results;
DROP POLICY IF EXISTS "Coaches read club physical_test_results v2" ON public.physical_test_results;
DROP POLICY IF EXISTS "Coaches can delete athlete test results" ON public.physical_test_results;
DROP POLICY IF EXISTS "Coaches can insert athlete test results" ON public.physical_test_results;
CREATE POLICY "Coaches read club physical_test_results v3" ON public.physical_test_results
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );
CREATE POLICY "Coaches insert club physical_test_results v3" ON public.physical_test_results
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(user_id)
  );
CREATE POLICY "Coaches delete club physical_test_results v3" ON public.physical_test_results
  FOR DELETE USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- competitions -----
DROP POLICY IF EXISTS "Coaches read club competitions v2" ON public.competitions;
DROP POLICY IF EXISTS "Coaches can delete competitions for their athletes" ON public.competitions;
DROP POLICY IF EXISTS "Coaches can insert competitions for their athletes" ON public.competitions;
CREATE POLICY "Coaches read club competitions v3" ON public.competitions
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );
CREATE POLICY "Coaches insert club competitions v3" ON public.competitions
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(user_id)
  );
CREATE POLICY "Coaches delete club competitions v3" ON public.competitions
  FOR DELETE USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- competition_reflections -----
DROP POLICY IF EXISTS "Coaches read club reflections v2" ON public.competition_reflections;
CREATE POLICY "Coaches read club reflections v3" ON public.competition_reflections
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- training_plans -----
DROP POLICY IF EXISTS "Coaches read club training plans v2" ON public.training_plans;
DROP POLICY IF EXISTS "Coaches can update athlete plans" ON public.training_plans;
DROP POLICY IF EXISTS "Coaches can create plans for athletes" ON public.training_plans;
CREATE POLICY "Coaches read club training_plans v3" ON public.training_plans
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );
CREATE POLICY "Coaches insert club training_plans v3" ON public.training_plans
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(user_id)
  );
CREATE POLICY "Coaches update club training_plans v3" ON public.training_plans
  FOR UPDATE USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- rehab_plans -----
DROP POLICY IF EXISTS "Coaches read club rehab plans v2" ON public.rehab_plans;
DROP POLICY IF EXISTS "Coaches can delete athlete rehab plans" ON public.rehab_plans;
DROP POLICY IF EXISTS "Coaches can insert athlete rehab plans" ON public.rehab_plans;
DROP POLICY IF EXISTS "Coaches can update athlete rehab plans" ON public.rehab_plans;
CREATE POLICY "Coaches read club rehab_plans v3" ON public.rehab_plans
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );
CREATE POLICY "Coaches insert club rehab_plans v3" ON public.rehab_plans
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(user_id)
  );
CREATE POLICY "Coaches update club rehab_plans v3" ON public.rehab_plans
  FOR UPDATE USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );
CREATE POLICY "Coaches delete club rehab_plans v3" ON public.rehab_plans
  FOR DELETE USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- health_data -----
DROP POLICY IF EXISTS "Coaches read club health data v2" ON public.health_data;
CREATE POLICY "Coaches read club health_data v3" ON public.health_data
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- wearable_daily_summary -----
DROP POLICY IF EXISTS "Coaches read club wearable summary v2" ON public.wearable_daily_summary;
CREATE POLICY "Coaches read club wearable_summary v3" ON public.wearable_daily_summary
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- mental_assessments -----
DROP POLICY IF EXISTS "Coaches can view athlete mental assessments" ON public.mental_assessments;
DROP POLICY IF EXISTS "Coaches read club mental_assessments v2" ON public.mental_assessments;
CREATE POLICY "Coaches read club mental_assessments v3" ON public.mental_assessments
  FOR SELECT USING (
    (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    OR (club_id IS NULL AND public.is_coach_of_athletes_club(user_id))
  );

----- session_attendance -----
DROP POLICY IF EXISTS "Coaches manage attendance for own athletes" ON public.session_attendance;
CREATE POLICY "Coaches manage club session_attendance v3" ON public.session_attendance
  FOR ALL USING (
    auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role)
    AND ((club_id IS NOT NULL AND public.is_coach_of_club(club_id))
         OR (club_id IS NULL AND public.is_coach_of_athletes_club(athlete_id)))
  ) WITH CHECK (
    auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(athlete_id)
  );

----- workout_log_feedback -----
DROP POLICY IF EXISTS "Coaches insert feedback for their athletes" ON public.workout_log_feedback;
CREATE POLICY "Coaches insert club workout_log_feedback v3" ON public.workout_log_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(athlete_id)
  );

----- event_reminders -----
DROP POLICY IF EXISTS "Coaches can insert reminders for their athletes" ON public.event_reminders;
CREATE POLICY "Coaches insert club event_reminders v3" ON public.event_reminders
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role)
    AND public.is_coach_of_athletes_club(athlete_id)
  );

----- coach_athlete_notes (already has v2 with is_coach_of_club; tighten fallback)
DROP POLICY IF EXISTS "Club coaches view shared notes v2" ON public.coach_athlete_notes;
CREATE POLICY "Club coaches view shared notes v3" ON public.coach_athlete_notes
  FOR SELECT USING (
    has_role(auth.uid(), 'coach'::app_role)
    AND auth.uid() <> coach_id
    AND club_id IS NOT NULL
    AND public.is_coach_of_club(club_id)
    AND public.club_shares_coach_notes(club_id)
  );
