CREATE POLICY "Users manage own antidoping cert files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'antidoping-certificates' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'antidoping-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);