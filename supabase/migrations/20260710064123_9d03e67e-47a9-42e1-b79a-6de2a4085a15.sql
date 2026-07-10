UPDATE public.chat_thread_members m
SET archived_at = t.archived_at
FROM public.chat_threads t
WHERE m.thread_id = t.id
  AND t.archived_at IS NOT NULL
  AND t.archived_by = m.user_id
  AND m.archived_at IS NULL;