ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own thread topics" ON realtime.messages;

CREATE POLICY "Authenticated can read own thread topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() = ('threads-' || auth.uid()::text)
    OR realtime.topic() LIKE ('threads-' || auth.uid()::text || '-%')
  )
  OR
  (
    realtime.topic() LIKE 'thread-%'
    AND EXISTS (
      SELECT 1
      FROM public.chat_thread_members m
      WHERE m.user_id = auth.uid()
        AND m.thread_id = substring(
          realtime.topic()
          FROM '^thread-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
        )::uuid
    )
  )
);