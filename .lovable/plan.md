## Diagnosis

Kian (athlete, no `coach`/`admin` role) is in club `4b827e40…`. He has one coach assigned. From the live network traffic I captured during his session:

- `GET profiles?select=display_name&user_id=eq.<coachId>` → **HTTP 406 / 0 rows**
- `GET profiles?select=user_id,display_name,avatar_url&user_id=in.(coachId, kian)` → only Kian, **coach row missing**
- The one existing direct thread with the coach is `archived_at` set (the coach archived it from her side); it shows up only under "Vis arkiv" in the thread list.

### Root cause: `profiles` RLS

Current SELECT policies on `public.profiles`:

```
auth.uid() = user_id           -- own profile
is_admin(auth.uid())           -- admins
EXISTS coach_athletes …        -- coaches see their athletes
is_parent_of(auth.uid(), …)    -- parents see linked athletes
```

There is **no policy** that lets an athlete read another club member's profile — not even their assigned coach. So in `getChattableContacts()`:

- `clubMateIds` query → 0 rows
- `clubProfiles` query → 0 rows
- `linkedProfiles` lookup for `coachIds` → 0 rows (coach profile filtered out)

Result: Kian's "Tilføj personer" / new-chat picker is empty, and he has no way to start a conversation. The earlier `chatApi` changes can't work without a corresponding RLS grant.

### Secondary issue: archived thread

When the coach archived the thread, `chat_threads.archived_at` and `archived_by` got set on the row itself, so the thread is bucketed under "Vis arkiv" for **both** sides. Kian's existing conversation is technically reachable (he can still POST to it — `chat_messages` INSERT only checks `is_chat_thread_member`), but it's hidden in the archive collapsible. Not the primary block, but worth fixing.

## Plan

### 1. DB migration — add a club-mate SELECT policy on `profiles`

```sql
CREATE POLICY "Club members can view each other's profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (users_share_club(auth.uid(), user_id));
```

`users_share_club` is already used on `diary_entries`, `competitions`, `form_curve_weekly`, `health_data`, etc., so this matches the established privacy boundary (same club = visible). It exposes `display_name` + `avatar_url` to clubmates, which is required for chat, squad views, and parent lookups; we already assume this elsewhere.

No schema change, no data migration.

### 2. Frontend — surface archived-by-other-side threads as active

In `src/components/chat/ThreadList.tsx`, change the filter so an archived thread is only treated as archived **for the person who archived it**. For everyone else it stays in the active list:

```ts
const isArchivedForMe = (t: any) => t.archived_at && t.archived_by === currentUserId;
const activeThreads   = threads.filter(t => !isArchivedForMe(t)).filter(matchesFilter);
const archivedThreads = threads.filter(t =>  isArchivedForMe(t)).filter(matchesFilter);
```

This requires passing/reading the current `user.id` in `ThreadList` (already available via `supabase.auth.getUser()` or pass-through prop). One-liner change in `useThreads.ts` `totalUnread` to match.

### 3. No changes to `chatApi.ts`

The earlier club-member expansion in `getChattableContacts` becomes effective the moment policy (1) ships — no code change needed.

## Verification

After the migration, run as Kian:
```sql
SELECT user_id, display_name FROM profiles WHERE club_id = '4b827e40-…';
```
Should return all clubmates (incl. his coach). His new-chat picker should then list them.

Reopen Kian's existing direct thread — it should appear in the active list (since he didn't archive it) and accept new messages.

## Out of scope
- No changes to chat_messages, chat_threads, or coach_athletes RLS.
- No backfill or data migration.
