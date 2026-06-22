-- 1. Loosen workout_logs so self-logged sessions (no plan) are allowed
ALTER TABLE public.workout_logs
  ALTER COLUMN plan_id DROP NOT NULL,
  ALTER COLUMN day_index DROP NOT NULL,
  ALTER COLUMN exercise_index DROP NOT NULL,
  ALTER COLUMN session_index DROP NOT NULL;

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'plan',
  ADD COLUMN IF NOT EXISTS activity_label text NULL,
  ADD COLUMN IF NOT EXISTS rpe smallint NULL;

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_entry_type_check;
ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_entry_type_check
  CHECK (entry_type IN ('plan', 'self'));

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_rpe_range_check;
ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_rpe_range_check
  CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));

-- 2. New table: club_activity_types
CREATE TABLE IF NOT EXISTS public.club_activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_activity_types_club_idx
  ON public.club_activity_types(club_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_activity_types TO authenticated;
GRANT ALL ON public.club_activity_types TO service_role;

ALTER TABLE public.club_activity_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club members read activity types" ON public.club_activity_types;
CREATE POLICY "Club members read activity types"
  ON public.club_activity_types FOR SELECT
  TO authenticated
  USING (public.is_member_of_club(club_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Coaches insert activity types" ON public.club_activity_types;
CREATE POLICY "Coaches insert activity types"
  ON public.club_activity_types FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Coaches update activity types" ON public.club_activity_types;
CREATE POLICY "Coaches update activity types"
  ON public.club_activity_types FOR UPDATE
  TO authenticated
  USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Coaches delete activity types" ON public.club_activity_types;
CREATE POLICY "Coaches delete activity types"
  ON public.club_activity_types FOR DELETE
  TO authenticated
  USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

-- 3. Seed default activity types for every existing club (idempotent)
INSERT INTO public.club_activity_types (club_id, label, sort_order, is_active, created_by)
SELECT c.id, v.label, v.sort_order, true, NULL
FROM public.clubs c
CROSS JOIN (VALUES
  ('Taekwondo', 0),
  ('Styrke', 1),
  ('Kondisjon', 2),
  ('Tøjning', 3),
  ('Andet', 4)
) AS v(label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.club_activity_types t
  WHERE t.club_id = c.id AND t.label = v.label
);