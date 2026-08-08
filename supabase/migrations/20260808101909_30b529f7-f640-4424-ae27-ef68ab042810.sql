UPDATE public.club_memberships
SET role_in_club = 'coach'
WHERE user_id = '1714092c-04ed-4731-85bc-392ad62b03fd'
  AND club_id = 'f379f491-94a4-454a-9cc2-37ed3e26dc28';

UPDATE public.profiles
SET role = 'coach',
    roles = ARRAY['athlete','coach']
WHERE user_id = '1714092c-04ed-4731-85bc-392ad62b03fd';