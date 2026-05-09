DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_messages'
      AND policyname = 'Sender updates own message'
  ) THEN
    CREATE POLICY "Sender updates own message"
      ON public.chat_messages
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());
  END IF;
END $$;