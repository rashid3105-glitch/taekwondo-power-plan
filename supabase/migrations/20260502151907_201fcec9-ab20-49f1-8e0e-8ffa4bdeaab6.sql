ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.waitlist ALTER COLUMN club DROP NOT NULL;

-- Update insert policy to allow optional club and validate role when present
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (club IS NULL OR char_length(club) BETWEEN 1 AND 120)
    AND (role IS NULL OR role IN ('athlete','coach','club'))
  );