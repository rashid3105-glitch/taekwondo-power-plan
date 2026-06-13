## Problem

When you typed Kian's parent email and hit "Send", the request reached the server but the email never went out. Edge logs show:

```
consent email send error: ... status: 401, statusText: "Unauthorized"
url: ".../send-transactional-email"
```

`send-transactional-email` is hardened to only accept a real logged-in user's token. The consent code was calling it with the service-role token (admin client), which it rejects. The function then swallowed the error and returned `ok: true, queued: false`, so the UI showed a success toast even though nothing was sent.

This affects three call sites:
1. `consent-coach-actions` → `send_parent_request` (the one you just hit)
2. `consent-coach-actions` → `remind_me` (coach reminder email)
3. `create-athlete` → auto parental-consent email when a coach creates a minor

## Fix

Forward the caller's existing `Authorization` header when invoking `send-transactional-email`, instead of the service-role admin client. The caller is always a logged-in coach/admin, so the downstream function's auth check passes.

### Files to change

**`supabase/functions/consent-coach-actions/index.ts`**
- Build a small helper that POSTs to `${SUPABASE_URL}/functions/v1/send-transactional-email` with:
  - `Authorization: <incoming authHeader>` (the coach's user JWT)
  - `apikey: SUPABASE_ANON_KEY`
  - JSON body identical to today's payload
- Replace both `admin.functions.invoke("send-transactional-email", ...)` calls (parent request + remind_me) with the helper.
- Treat non-2xx as a real failure and return `{ ok: false, queued: false, error }` so the UI can show a proper error toast instead of a false success.

**`supabase/functions/create-athlete/index.ts`**
- Same swap: invoke `send-transactional-email` using the original `authHeader` (already available in the function) instead of the `adminClient`.
- Keep the existing best-effort behaviour (don't fail athlete creation if the email fails), but log the actual status code so we can see it in logs.

**`src/components/coach/ConsentMissingPanel.tsx`** (small UX safety net)
- Currently treats `{ ok: true, queued: false }` as success. Change the success toast to require `queued === true`; otherwise show `consentParentRequestFailed`. No new translation keys needed.

### Out of scope
- No schema changes, no RLS changes, no new tables.
- No change to `send-transactional-email` itself — keeping its strict auth is correct.
- No change to translations or Help/changelog (purely a backend bug fix).

### Verification
1. Re-deploy `consent-coach-actions` and `create-athlete`.
2. From the coach UI, enter the parent's email for Kian and click Send.
3. Confirm in `email_send_log` that a `parental-consent-request` row is created with `status='sent'` and `recipient_email` = the parent's address.
4. Check the parent's inbox.
