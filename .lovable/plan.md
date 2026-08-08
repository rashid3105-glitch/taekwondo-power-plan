# Fail loud when the admin list is empty

Today, `/admin/approval` renders zeros in three very different situations: the backend endpoint is old and returns no profiles, the direct database read is blocked, or the database is genuinely empty. They look identical, so a stale installed app appears to be "working with 0 users".

This change makes the degraded path visible instead of silent. Scope is this one page — no backend, RLS, or data changes.

## What changes

In `src/pages/AdminApproval.tsx`, inside `loadUsers()`:

1. Track whether the profile list came from the protected endpoint or from the fallback query.
2. After the list is built, if the endpoint returned no `profiles` array (old deployment) **and** the fallback returned zero rows, set a distinct warning state instead of leaving the page at zeros.
3. Render a warning banner above the stats cards (amber, separate from the existing red error banner):
   "Kunne ikke bekræfte admin-adgang — appen er muligvis forældet. Opdatér appen, eller prøv igen."
   With a "Prøv igen" button reusing the existing reload handler.
4. Keep the existing red `loadError` banner unchanged for real errors.

Also, when the endpoint payload is missing entirely, the banner text notes that the installed app may be running an older version — that is the actual signal an admin needs.

## Technical notes

- New state: `staleWarning: boolean`, reset at the top of `loadUsers()` alongside `setLoadError(null)`.
- Condition: `!functionProfiles && (profilesRes.data?.length ?? 0) === 0`.
- Banner placed next to the existing `loadError` block (~line 1012), before the stats grid, so it is visible without scrolling on mobile.
- No changes to `clubScope`, filters, stats math, or the edge function.

## Not in scope

The rebuild/ship steps (`git pull`, `npm run build`, `npx cap sync ios`) and verifying the local `capacitor.config.ts` are done on your machine; Lovable's copy already has no `server.url`.
