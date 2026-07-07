## Goal

When an athlete saves a diary entry, in addition to today's email + push, also drop a real chat message into each coach's inbox with a link that jumps straight to the athlete's diary.

## Changes

### 1. Edge function — `supabase/functions/notify-coaches-athlete-activity/index.ts`
After the existing email + push loops, for `activity_type === "diary"` only:
- Reuse the already-resolved `coachProfiles` list and `athleteUserId` / `athleteName`.
- For each coach:
  1. Call the existing `start_direct_thread` RPC (service-role) with `_other_user` pairing coach ↔ athlete. Because `start_direct_thread` uses `auth.uid()`, we can't call it as service role on behalf of another user; instead insert directly:
     - Look up an existing `direct` thread that has both `coach.user_id` and `athleteUserId` as members (query `chat_thread_members` twice / use existing helper SQL). If none, insert a new `chat_threads` row (`kind='direct'`, `created_by=athleteUserId`) and two `chat_thread_members` rows.
  2. Insert a `chat_messages` row with `sender_id = athleteUserId`, `body` = localized text such as `"📓 Ny dagbogsopdatering – åbn dagbog"` followed by the deep link `${SITE_URL}/coach/athlete/${athleteUserId}?diary=1`. Localize via existing `pushI18n.ts` (add new keys `diaryChatMessage` / `openDiaryLink`).
  3. Cooldown: skip insert if an identical system message from this athlete already exists in the thread within the last 24 h (query `chat_messages` filtered by `sender_id`, `thread_id`, `created_at >= now()-'24h'`, body starts with the localized prefix). This matches the existing email cooldown.
- Wrap the whole block in `try/catch` — chat failure must not break email/push.

### 2. Deep-link handling — `src/pages/CoachAthleteOverview.tsx`
- Read `?diary=1` from `useSearchParams` in an effect after `authorized === true`; when present, call `openDiary()` once.

### 3. Localization — `supabase/functions/_shared/pushI18n.ts`
Add two keys per supported locale:
- `diaryChatMessagePrefix` → e.g. Danish: `"📓 Ny dagbogsopdatering fra {name}"`.
- `openDiaryLinkLabel` → `"Åbn dagbog"` (used only inside chat body as fallback text before the URL).

### Non-goals
- No new tables, no schema migration (uses existing `chat_threads`, `chat_thread_members`, `chat_messages`).
- No changes to competition-reflection flow (out of scope of this request).
- No custom message-rendering; the deep link is plain text — existing chat UI already linkifies URLs (verify quickly; if it doesn't, add a minimal URL-detection render in the chat message component in a follow-up).
- No changes to the athlete-side dashboard "messages" card — coaches will see the new message through the same unread-message counter and thread list that already power `/messages`.

## Technical notes
- Direct-thread lookup as service role: `select thread_id from chat_thread_members where user_id in (coach, athlete) group by thread_id having count(*) = 2` joined against `chat_threads.kind='direct'`.
- `SITE_URL` already available in edge functions via `Deno.env.get("SITE_URL")` fallback to `https://sportstalent.dk`.
- Push notification (already sent) already routes to `/coach`; chat message provides the deeper `/coach/athlete/:id?diary=1` link.
