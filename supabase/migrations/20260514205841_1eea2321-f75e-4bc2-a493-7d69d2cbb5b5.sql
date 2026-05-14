-- Lock down Realtime channel subscriptions so users can only listen to
-- topics they are authorized for. Without RLS on realtime.messages, any
-- authenticated user could subscribe to another user's chat thread topic.

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own thread topics" ON realtime.messages;

CREATE POLICY "Authenticated can read own thread topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Personal feed channel: threads-<my user id>
  (realtime.topic() = ('threads-' || auth.uid()::text))
  OR
  -- Per-thread channel: thread-<thread uuid>, only if the caller is a member
  (
    realtime.topic() LIKE 'thread-%'
    AND EXISTS (
      SELECT 1 FROM public.chat_thread_members m
      WHERE m.user_id = auth.uid()
        AND m.thread_id::text = substring(realtime.topic() from 8)
    )
  )
);
