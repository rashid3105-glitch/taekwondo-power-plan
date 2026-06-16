
-- 1a. Drop duplicate legacy NULL rows
DELETE FROM public.coach_athletes ca_null
WHERE ca_null.club_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca_real
    WHERE ca_real.coach_id  = ca_null.coach_id
      AND ca_real.athlete_id = ca_null.athlete_id
      AND ca_real.club_id IS NOT NULL
  );

-- 1b. Backfill remaining NULL rows with athlete's primary club
UPDATE public.coach_athletes ca
SET club_id = p.club_id
FROM public.profiles p
WHERE ca.club_id IS NULL
  AND p.user_id = ca.athlete_id
  AND p.club_id IS NOT NULL;

-- 1c. Drop rows still NULL (no scope possible)
DELETE FROM public.coach_athletes WHERE club_id IS NULL;

-- 1d. Tighten unique constraint
DROP INDEX IF EXISTS public.coach_athletes_coach_athlete_club_uniq;
ALTER TABLE public.coach_athletes ALTER COLUMN club_id SET NOT NULL;
CREATE UNIQUE INDEX coach_athletes_coach_athlete_club_uniq
  ON public.coach_athletes(coach_id, athlete_id, club_id);

-- 1e. Manual fix for Danilo -> UC Copenhagen
INSERT INTO public.club_memberships (user_id, club_id, role_in_club, status)
VALUES ('b8247617-2a2d-4d7a-9b81-e5dced8a016d',
        '440ea492-d704-454b-971b-f2dd3d1028c7','athlete','active')
ON CONFLICT (user_id, club_id, role_in_club) DO UPDATE SET status='active';

INSERT INTO public.coach_athletes (coach_id, athlete_id, club_id)
VALUES ('117a7c4c-5cae-44cf-a5e3-0bee2d1cbb70',
        'b8247617-2a2d-4d7a-9b81-e5dced8a016d',
        '440ea492-d704-454b-971b-f2dd3d1028c7')
ON CONFLICT DO NOTHING;
