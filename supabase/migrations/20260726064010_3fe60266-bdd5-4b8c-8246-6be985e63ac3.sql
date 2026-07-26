CREATE TABLE public.running_program_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  club_id UUID,
  program_id TEXT NOT NULL,
  goal_km NUMERIC NOT NULL,
  weeks INTEGER NOT NULL,
  per_week INTEGER NOT NULL DEFAULT 3,
  level TEXT NOT NULL DEFAULT 'beginner',
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.running_program_enrollments TO authenticated;
GRANT ALL ON public.running_program_enrollments TO service_role;

ALTER TABLE public.running_program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own running programs"
ON public.running_program_enrollments FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view their club athletes running programs"
ON public.running_program_enrollments FOR SELECT TO authenticated
USING (public.is_coach_of_athletes_club(user_id) OR public.is_superadmin(auth.uid()));

CREATE POLICY "Parents can view their athletes running programs"
ON public.running_program_enrollments FOR SELECT TO authenticated
USING (public.is_parent_of(auth.uid(), user_id));

CREATE INDEX idx_running_enrollments_user_active
  ON public.running_program_enrollments (user_id, is_active);

CREATE TRIGGER update_running_program_enrollments_updated_at
BEFORE UPDATE ON public.running_program_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER stamp_running_program_enrollments_club_id
BEFORE INSERT ON public.running_program_enrollments
FOR EACH ROW EXECUTE FUNCTION public.stamp_club_id_from_user();