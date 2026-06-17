DROP FUNCTION IF EXISTS public.get_club_member_profiles(uuid);

CREATE OR REPLACE FUNCTION public.get_club_member_profiles(_club_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  athlete_code text,
  age integer,
  weight_kg numeric,
  belt_level text,
  experience_years integer,
  goals text[],
  tkd_sessions_per_week integer,
  current_injury text,
  program_weeks integer,
  weekly_schedule jsonb,
  avatar_url text,
  discipline text,
  club_id uuid,
  country text,
  is_coach boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id, p.display_name, p.athlete_code, p.age, p.weight_kg,
    p.belt_level, p.experience_years, p.goals, p.tkd_sessions_per_week,
    p.current_injury, p.program_weeks, p.weekly_schedule, p.avatar_url,
    p.discipline, _club_id AS club_id, p.country,
    public.has_role(p.user_id, 'coach'::app_role) AS is_coach
  FROM public.profiles p
  WHERE public.is_coach_of_club(_club_id)
    AND EXISTS (
      SELECT 1 FROM public.club_memberships m
      WHERE m.user_id = p.user_id AND m.club_id = _club_id AND m.status = 'active'
    )
$$;