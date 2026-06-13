INSERT INTO public.consent_records (athlete_id, consent_type, status, club_id, grace_until)
SELECT p.user_id,
       'health_data_processing',
       'pending',
       p.club_id,
       now() + interval '30 days'
FROM public.profiles p
WHERE (
    (p.birth_date IS NOT NULL AND date_part('year', age(p.birth_date))::int < 18)
    OR (p.birth_date IS NULL AND p.age IS NOT NULL AND p.age < 18)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.consent_records c
    WHERE c.athlete_id = p.user_id AND c.consent_type = 'health_data_processing'
  )
ON CONFLICT (athlete_id, consent_type) DO NOTHING;