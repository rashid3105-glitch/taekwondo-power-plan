
## Fix: “Send message” / feedback composer returns Edge Function non-2xx

### Problem

The error in your screenshot is happening when the coach taps **Send message** in the Coach Dashboard message composer.

The client calls the backend function:

- `send-coach-message`

That function is currently configured in `supabase/config.toml` with:

```toml
[functions.send-coach-message]
verify_jwt = true
```

But this project’s authenticated backend functions are using the in-function auth pattern instead:

- the request includes the bearer token
- the function creates a user-scoped client
- the function validates the user in code with `userClient.auth.getUser()`

Because of that setup, platform-level JWT verification is rejecting the request before the function even boots. That matches the evidence:

- the UI shows the generic “Edge Function returned a non-2xx status code”
- there are no fresh runtime logs for `send-coach-message`
- the function source already contains its own auth guard and coach-role check

### Solution

Update the function config so the request can reach the function code:

```toml
[functions.send-coach-message]
verify_jwt = false
```

No logic rewrite is needed in the function itself. Its current code already:

- rejects missing auth headers
- verifies the signed-in user via `auth.getUser()`
- checks the caller has the `coach` role
- limits recipients to managed athletes or club athletes
- inserts `coach_messages`
- attempts email delivery separately

### Files to change

- `supabase/config.toml`
  - change `send-coach-message` from `verify_jwt = true` to `verify_jwt = false`

### Why this is the right fix

`supabase/functions/send-coach-message/index.ts` already handles authentication and authorization correctly in-code:

- reads `Authorization`
- builds a user client with that header
- calls `userClient.auth.getUser()`
- checks `has_role(..., 'coach')`

So the failure is not missing business logic. It is the request being blocked too early by the function config.

### Verification

After the config change deploys:

1. Open the coach message composer
2. Enter a subject and message
3. Tap **Send message**

Expected result:

- no red non-2xx toast
- success toast appears
- a row is created in **Sent history → Messages**
- athletes receive the inbox item
- email sending may show partial counts (`emailed` / `failed`) without blocking the message itself

### Out of scope

- No database migration
- No UI changes
- No changes to `send-transactional-email` in this pass
- No broader audit of every function using `verify_jwt = true`

### Technical note

This is the same class of issue as the earlier match-share failure: a direct client-invoked function is using platform JWT verification even though this project’s runtime auth pattern validates inside the function.
