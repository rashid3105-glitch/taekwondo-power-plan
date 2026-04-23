

## Fix: "Share" on match video returns Edge Function non-2xx error

### Root cause

The `share-match-video` edge function is set to `verify_jwt = true` in `supabase/config.toml`, but every other authenticated function in this project (e.g. `delete-my-account`, `update-my-profile`, `send-coach-message`) is set to `verify_jwt = false` and validates the user in-code via `supabase.auth.getUser()`. With the project's signing-keys auth setup, platform-level JWT verification rejects the request before the function boots — which matches what the logs show (no fresh boots when Share is clicked).

The companion function `get-shared-match` (used by the public `/match/share/:token` page) is already correctly set to `verify_jwt = false`. The share-creation function just got missed.

### The fix

**One line in `supabase/config.toml`:**

```toml
[functions.share-match-video]
verify_jwt = false
```

The function code itself is already correct — it validates the Bearer token in-code (lines 20–25 reject missing/malformed Authorization, then `userClient.auth.getUser()` rejects invalid tokens), and uses an RLS-respecting client so only the owning coach can update their own video.

### Files changed

- `supabase/config.toml` — flip `verify_jwt` from `true` to `false` for `share-match-video`

### Out of scope

- No changes to the function code, RLS, DB schema, or UI — the in-code auth check is already there and correct.
- Not auditing other functions in the same pass; the symptom is isolated to Share. (If a similar pattern is later observed on `apply-competition-taper` or `send-coach-message`, those would warrant the same one-line change — flag for a follow-up if it appears.)

### How we'll verify

After the change deploys, click **Del** on a match video → expect a green "Link created" toast and the `https://sportstalent.dk/match/share/<token>` URL to appear under the header. Edge function logs should show a fresh boot followed by a 200 response.

