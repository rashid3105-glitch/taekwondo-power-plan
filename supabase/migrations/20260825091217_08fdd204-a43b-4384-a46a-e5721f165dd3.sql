CREATE TABLE public.club_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  external_ref text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX club_teams_club_name_active_uidx
  ON public.club_teams (club_id, lower(name)) WHERE is_active;
CREATE INDEX club_teams_club_idx ON public.club_teams (club_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_teams TO authenticated;
GRANT ALL ON public.club_teams TO service_role;
ALTER TABLE public.club_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_teams_select_members" ON public.club_teams
  FOR SELECT TO authenticated
  USING (public.is_member_of_club(club_id) OR public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));
CREATE POLICY "club_teams_insert_coach" ON public.club_teams
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));
CREATE POLICY "club_teams_update_coach" ON public.club_teams
  FOR UPDATE TO authenticated
  USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));
CREATE POLICY "club_teams_delete_coach" ON public.club_teams
  FOR DELETE TO authenticated
  USING (public.is_coach_of_club(club_id) OR public.is_admin(auth.uid()));

CREATE TABLE public.club_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.club_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX club_team_members_team_idx ON public.club_team_members (team_id);
CREATE INDEX club_team_members_user_idx ON public.club_team_members (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_team_members TO authenticated;
GRANT ALL ON public.club_team_members TO service_role;
ALTER TABLE public.club_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_team_members_select" ON public.club_team_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.club_teams t
      WHERE t.id = club_team_members.team_id
        AND (public.is_member_of_club(t.club_id) OR public.is_coach_of_club(t.club_id) OR public.is_admin(auth.uid()))
    )
  );
CREATE POLICY "club_team_members_insert_coach" ON public.club_team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_teams t
      WHERE t.id = club_team_members.team_id
        AND (public.is_coach_of_club(t.club_id) OR public.is_admin(auth.uid()))
    )
  );
CREATE POLICY "club_team_members_delete_coach" ON public.club_team_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_teams t
      WHERE t.id = club_team_members.team_id
        AND (public.is_coach_of_club(t.club_id) OR public.is_admin(auth.uid()))
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_team_member_same_club()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _club uuid;
BEGIN
  SELECT club_id INTO _club FROM public.club_teams WHERE id = NEW.team_id;
  IF _club IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.club_memberships m
    WHERE m.user_id = NEW.user_id AND m.club_id = _club AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is not an active member of this club';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_team_members_same_club
BEFORE INSERT OR UPDATE ON public.club_team_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_team_member_same_club();