# Chat / Messaging — Build Plan

A Messenger-style chat for logged-in coaches and athletes. Realtime, 1-on-1 + club group chats, text + emoji, image/short video attachments (max 1 MB), read receipts and unread badges. Lives at `/messages` and as a quick drawer from the header.

## Scope

**Who can chat**
- Coach ↔ any of their managed athletes or athletes in the same club
- Athlete ↔ their coach(es)
- Group chats: a coach can create a group with multiple athletes from their club/managed list
- Admins can view nothing extra (privacy)

**Out of scope (v1)**
- Reactions, replies/threads, edits, voice notes, typing indicators, link previews, message search

## UX

**Entry points**
- New `MessagesIcon` in dashboard header (next to `EventRemindersDropdown`) showing unread count badge. Click opens a slide-in drawer with the thread list + active conversation.
- Full page at `/messages` with two-pane layout (thread list + conversation). Mobile shows one pane at a time with back button.
- Same icon added to coach header on `/coach`.

**Thread list item**
- Avatar (other person, or stacked avatars for groups), name/group title, last message preview, time, unread dot.
- Sorted by last message time desc.

**Conversation view**
- Header: avatar + name (tap → profile / coach athlete overview), back button on mobile.
- Bubble list: own messages right (red accent), others left (muted card). Day separators. "Seen" tick under own last read message.
- Composer: textarea (auto-grow, max 2000 chars), emoji picker button (`emoji-picker-react` already lightweight, or simple native), paperclip for attachment, send button. Min 44px touch targets.
- Attachment preview before send. Client-side validation: ≤ 1 MB, image/* or video/* (mp4/webm/quicktime). Reject otherwise with sonner toast.

**Group chats**
- "New group" button (coaches only). Pick name + members from coach's athlete list. Athletes can leave; coach can add/remove members and rename.

**Empty / offline / loading**
- Use existing skeleton patterns and `OfflineBanner`. Sending while offline → queued in local state, retried on reconnect (simple version, not full IndexedDB outbox in v1).

## Data model (new tables)

```
chat_threads
  id uuid pk, kind text ('direct'|'group'), title text null,
  club_id uuid null, created_by uuid, created_at, updated_at,
  last_message_at timestamptz

chat_thread_members
  thread_id uuid, user_id uuid, role text ('owner'|'member'),
  joined_at, last_read_at timestamptz, muted bool default false,
  primary key (thread_id, user_id)

chat_messages
  id uuid pk, thread_id uuid, sender_id uuid,
  body text, attachment_path text null, attachment_type text null,
  attachment_size_bytes int null, created_at, deleted_at null
```

Index `chat_messages(thread_id, created_at desc)`, `chat_thread_members(user_id)`.

**RLS (recursion-safe via SECURITY DEFINER helpers)**
- `is_thread_member(_thread, _uid)` SECURITY DEFINER → boolean
- `chat_thread_members`: select rows where `user_id = auth.uid()` OR `is_thread_member(thread_id, auth.uid())`. Insert/update only by thread owner or self-leave.
- `chat_threads`: select where `is_thread_member(id, auth.uid())`. Insert via RPC (see below).
- `chat_messages`: select where `is_thread_member(thread_id, auth.uid())` and `deleted_at is null`. Insert where sender = auth.uid() and member of thread. Update only own `deleted_at` (soft delete).

**SECURITY DEFINER RPCs**
- `start_direct_thread(_other_user uuid)` → finds existing direct thread or creates one. Validates that caller and `_other_user` are coach/athlete-linked or share a club.
- `create_group_thread(_title text, _member_ids uuid[])` → coach-only. Validates each member is managed by or shares club with caller.
- `mark_thread_read(_thread_id uuid)` → updates `last_read_at = now()` for caller.
- `unread_thread_counts()` → returns rows `(thread_id, unread_count)` for current user.
- `add_group_member(_thread, _user)`, `remove_group_member(_thread, _user)`, `rename_group(_thread, _title)` — owner only.

**Realtime**
- `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, chat_thread_members, chat_threads;`
- Client subscribes to `postgres_changes` filtered by `thread_id` for the open conversation, plus a global subscription on `chat_messages` filtered by membership for unread badge updates.

## Storage

- New private bucket `chat-attachments`.
- Path layout: `chat-attachments/{thread_id}/{message_id}-{filename}`.
- RLS on `storage.objects`: select/insert allowed only when `is_thread_member(thread_id_from_path, auth.uid())`. Helper `chat_thread_id_from_path(name)` parses the first folder segment.
- 1 MB hard cap enforced client-side; edge function double-check on insert (reject row if `attachment_size_bytes > 1_048_576`).
- Display via signed URLs (mirrors existing `useAvatarUrl` pattern → new `useChatAttachmentUrl`).

## Frontend structure

New files:
- `src/pages/Messages.tsx` — full page, two-pane responsive
- `src/components/chat/ChatDrawer.tsx` — header drawer
- `src/components/chat/ThreadList.tsx`
- `src/components/chat/Conversation.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/MessageComposer.tsx`
- `src/components/chat/NewGroupDialog.tsx`
- `src/components/chat/StartChatPicker.tsx`
- `src/components/chat/MessagesIcon.tsx` (header bell-style icon w/ badge)
- `src/hooks/useThreads.ts`, `useMessages.ts`, `useUnreadCounts.ts`, `useChatAttachmentUrl.ts`
- `src/lib/chatApi.ts` — RPC wrappers + send/upload helpers

Edits:
- `src/App.tsx` — add `/messages` route (auth required)
- Dashboard + Coach headers — mount `<MessagesIcon />`
- "Send message" entry on `CoachAthleteOverview` and athlete profile cards → calls `start_direct_thread` then opens drawer
- `src/i18n/translations.ts` — DA/EN/SV/DE/AR strings

## Notifications

- Reuse existing `send-push` edge function: on new message, trigger via DB webhook or after-insert RPC call sending push to all thread members except sender, respecting `notification_preferences` (add new `chat_messages` boolean, default true).
- Email digest: skipped in v1 to keep scope tight.

## Migration order

1. Migration: tables, indexes, RLS helpers, RLS policies, RPCs, storage bucket + policies, realtime publication, `notification_preferences.chat_messages` column.
2. Frontend: hooks → components → page/drawer → header integration → entry points from coach/athlete screens.
3. Translations + memory update (new `mem://features/chat` entry).
4. QA: 1:1 from coach side, 1:1 from athlete side, group create, attachment upload at 1 MB and just over, offline send retry, unread badge across tabs (realtime), RLS — try reading another club's thread (must fail).

## Risks / decisions to confirm during build

- Group chat ownership: coach-only create; if owner leaves group, transfer to another coach in club or auto-archive. Default to **archive** in v1.
- 1 MB cap on video is very tight (≈3–5 sec at low quality). Confirm with user later whether to bump to 5 MB or transcode.
- Push notifications require service worker already configured (it is). No new secrets needed.
