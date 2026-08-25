ALTER TABLE public.diary_comments ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);
ALTER TABLE public.athlete_module_overrides ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);
ALTER TABLE public.athlete_week_technique_focus ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);

CREATE INDEX IF NOT EXISTS idx_diary_comments_club_id ON public.diary_comments(club_id);
CREATE INDEX IF NOT EXISTS idx_athlete_module_overrides_club_id ON public.athlete_module_overrides(club_id);
CREATE INDEX IF NOT EXISTS idx_athlete_week_technique_focus_club_id ON public.athlete_week_technique_focus(club_id);