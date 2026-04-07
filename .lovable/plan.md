

## Plan: Fix profile save reliability and stale build error

### Build error (lines 384-404)
The reported TS1117 errors are **stale** — the file has no duplicate keys (verified by scanning all 4 locale blocks) and `tsc --noEmit` compiles cleanly. No code changes needed for this; a rebuild will clear it.

### Profile save issue for user "Ky Tu"
The most likely cause: **silent RLS rejection**. When Supabase RLS blocks an update, `.update()` returns 0 affected rows but no error. The app shows "Profile saved" even though nothing was written. Two possible root causes:

1. **Expired auth session** — the console shows `Invalid Refresh Token: Refresh Token Not Found`. If the session is stale, `auth.uid()` in RLS returns null, and the update silently fails.
2. **Protected field mismatch** — if any protected field (is_approved, payment_status, etc.) doesn't match its current DB value, RLS rejects the row.

### Changes

**File: `src/pages/ProfileSetup.tsx`** (handleSubmit function)
- After the update call, check if `data` is empty/null and `error` is null — this indicates a silent RLS rejection
- Add `.select()` to the update chain to get the returned row count
- If 0 rows updated, show a descriptive error toast instead of "Profile saved"
- Before attempting the update, verify the user session is valid; if not, redirect to `/auth`

```typescript
// Changed update call:
const { data, error } = await supabase
  .from("profiles")
  .update({ ... })
  .eq("user_id", user.id)
  .select();

if (error) throw error;
if (!data || data.length === 0) {
  toast({ title: t("error"), description: "Profile could not be saved. Please sign out and sign in again.", variant: "destructive" });
  return;
}
toast({ title: t("profileSaved") });
```

### Technical details
- The `.select()` chained after `.update()` makes Supabase return the updated rows, allowing us to detect silent RLS rejections (0 rows returned = blocked)
- No database or RLS changes needed — the policies are correct; the issue is the client not detecting failures
- Single file change, ~10 lines modified

