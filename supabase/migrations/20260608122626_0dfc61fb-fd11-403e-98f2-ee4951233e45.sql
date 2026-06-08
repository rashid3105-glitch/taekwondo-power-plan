
-- 1) Profiles: add explicit USING clause to the self-update policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own profile" ON public.profiles';
  END IF;
END$$;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Storage: owner-scoped UPDATE policy for chat-attachments bucket
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'chat_attachments_owner_update'
  ) THEN
    EXECUTE 'DROP POLICY "chat_attachments_owner_update" ON storage.objects';
  END IF;
END$$;

CREATE POLICY "chat_attachments_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-attachments' AND owner = auth.uid())
WITH CHECK (bucket_id = 'chat-attachments' AND owner = auth.uid());
