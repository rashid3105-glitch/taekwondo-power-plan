
DROP POLICY IF EXISTS "Sender deletes own attachment" ON storage.objects;
CREATE POLICY "Sender deletes own attachment"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND public.is_chat_thread_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

DROP POLICY IF EXISTS "Uploaders can delete their competition invitations" ON storage.objects;
CREATE POLICY "Uploaders can delete their competition invitations"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'competition-invitations'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid())
  )
);

ALTER TABLE public.physical_test_results
  ADD CONSTRAINT physical_test_results_test_type_check
  CHECK (test_type IN ('individual','team')) NOT VALID;
