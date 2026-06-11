-- 1. Chat attachment UPDATE: require thread membership (mirror INSERT)
DROP POLICY IF EXISTS "chat_attachments_owner_update" ON storage.objects;
CREATE POLICY "chat_attachments_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND public.is_chat_thread_member(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND public.is_chat_thread_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

-- 2. Profiles self-update: lock sensitive fields to their stored values
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_approved      = (SELECT f.is_approved      FROM public.get_profile_protected_fields(user_id) f)
  AND payment_status   = (SELECT f.payment_status   FROM public.get_profile_protected_fields(user_id) f)
  AND NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM public.get_profile_protected_fields(user_id) f))
  AND is_demo          = (SELECT f.is_demo          FROM public.get_profile_protected_fields(user_id) f)
  AND demo_full_access = (SELECT f.demo_full_access FROM public.get_profile_protected_fields(user_id) f)
  AND NOT (club_id          IS DISTINCT FROM (SELECT f.club_id          FROM public.get_profile_protected_fields(user_id) f))
  AND NOT (demo_expires_at  IS DISTINCT FROM (SELECT f.demo_expires_at  FROM public.get_profile_protected_fields(user_id) f))
);