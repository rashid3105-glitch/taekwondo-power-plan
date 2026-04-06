
-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop existing public SELECT policy on avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Add authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
