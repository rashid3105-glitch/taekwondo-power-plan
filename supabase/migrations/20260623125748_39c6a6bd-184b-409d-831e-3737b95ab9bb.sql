CREATE TABLE public.taekwondo_drills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  video_url text,
  category text NOT NULL CHECK (category IN ('kicks','combinations','footwork','poomsae','sparring','conditioning')),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.taekwondo_drills TO authenticated;
GRANT ALL ON public.taekwondo_drills TO service_role;

ALTER TABLE public.taekwondo_drills ENABLE ROW LEVEL SECURITY;

-- Read: global drills (club_id IS NULL) OR same club as the caller; only active for non-admins.
CREATE POLICY "Members read global and own club active drills"
ON public.taekwondo_drills
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    club_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.club_id = taekwondo_drills.club_id
    )
  )
);

-- Admin read all (including inactive) for management.
CREATE POLICY "Admins read all drills"
ON public.taekwondo_drills
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert drills"
ON public.taekwondo_drills
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update drills"
ON public.taekwondo_drills
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete drills"
ON public.taekwondo_drills
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_taekwondo_drills_updated_at
BEFORE UPDATE ON public.taekwondo_drills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_taekwondo_drills_club ON public.taekwondo_drills(club_id) WHERE is_active = true;
CREATE INDEX idx_taekwondo_drills_category ON public.taekwondo_drills(category);