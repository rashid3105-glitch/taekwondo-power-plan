-- GDPR art. 8 national digital consent ages, per September 2026.
-- Values are based on best available knowledge and SHOULD BE VERIFIED LEGALLY.
-- DK/SE/NO stay at 15 (deliberate choice: health data). Default 16 (unknown country)
-- and fail-safe 18 (on error) are unchanged.
INSERT INTO public.digital_consent_ages (country_code, age) VALUES
 ('AT',14),('BE',13),('BG',14),('HR',16),('CY',14),('CZ',15),('DE',16),('EE',13),
 ('ES',14),('FI',13),('FR',15),('GR',15),('HU',16),('IE',16),('IS',13),('IT',14),
 ('LV',13),('LI',16),('LT',14),('LU',16),('MT',13),('NL',16),('PL',16),('PT',13),
 ('RO',16),('SK',16),('SI',15),('GB',13),('CH',16),
 ('DK',15),('SE',15),('NO',15)
ON CONFLICT (country_code) DO UPDATE SET age = EXCLUDED.age, updated_at = now();