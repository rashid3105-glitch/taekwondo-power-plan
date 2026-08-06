ALTER TABLE public.user_exercises
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_exercises_visibility_check'
  ) THEN
    ALTER TABLE public.user_exercises
      ADD CONSTRAINT user_exercises_visibility_check
      CHECK (visibility IN ('private', 'club'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_exercises_club_visibility_idx
  ON public.user_exercises (club_id, visibility);

DROP POLICY IF EXISTS "Club members can view club exercises" ON public.user_exercises;
CREATE POLICY "Club members can view club exercises"
  ON public.user_exercises FOR SELECT
  TO authenticated
  USING (visibility = 'club' AND club_id IS NOT NULL AND public.is_member_of_club(club_id));