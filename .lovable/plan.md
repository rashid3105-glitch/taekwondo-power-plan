

## Tighter admin/coach scoping — without per-club pages

Two small, high-value changes instead of duplicating pages per club.

### A. Club label everywhere an athlete name appears (coach + admin UI)

Adds a small muted club chip next to athlete names in coach and admin views, so it's visually impossible to confuse two athletes from different clubs. No DB changes — `club_id` and `club_name` are already loaded in most coach queries (`get_club_member_profiles`, `get_squad_overview`).

Touched files (display only):
- `src/pages/CoachDashboard.tsx` — managed athletes list, club athletes list, message recipient picker, send-reminder picker
- `src/components/coach/SquadOverview.tsx` — squad rows
- `src/components/coach/SessionAttendance.tsx` — attendance rows
- `src/components/coach/CoachSentHistory.tsx` — sent message rows
- `src/components/coach/PhysicalTestComparison.tsx` — comparison rows
- `src/pages/AdminApproval.tsx` — admin user rows (chip in addition to existing club grouping)
- `src/pages/AdminPayments.tsx` — payment user rows

Style: small `text-[10px] text-muted-foreground` chip, `Building` icon prefix, only rendered when `club_name` is present.

### B. Single "Club scope" filter on admin pages

A dropdown at the top of `/admin/approval` and `/admin/payments` (data already loaded; just filter client-side):
- Default: **"All clubs"**
- Selecting a club narrows the list to that club only
- Persists in `localStorage` per page so admin returns to the same scope

This gives you the *practical* benefit of "separate club pages" (focused view, less misclick risk) **without** introducing new routes, duplicated state, or per-club permission logic.

Touched files:
- `src/pages/AdminApproval.tsx` — add filter dropdown above the existing club groups
- `src/pages/AdminPayments.tsx` — add filter dropdown above the user list

### C. Rename "Manage Users" → "Admin"

Just a label change in the dashboard side menu. Already have the `admin` translation key in all 6 locales — no new translations needed.

Touched files:
- `src/pages/Dashboard.tsx` — change `t("manageUsers")` to `t("admin")` in the side menu admin link
- *(Optional)* leave the `manageUsers` key in `translations.ts` for now in case it's referenced elsewhere; remove later if unused.

### What we're explicitly NOT doing (and why)

- **No per-club routes (`/admin/club/:id/...`)** — RLS already enforces club isolation at the database. Per-club URLs would be UI-only, add navigation cost, and duplicate logic. Filter + chips deliver the same daily-use benefit.
- **No new tables, RPCs, or RLS changes** — current security model is sound; this work is purely UI clarity.
- **No changes to coach pages' data scope** — coaches already see only their own athletes + their club, enforced server-side.

### Out-of-scope follow-ups worth noting

- A short memory note documenting the read-vs-write asymmetry of coach RLS (read = whole club, write = managed athletes only) so future changes don't accidentally widen it.
- If `manageUsers` translation key is no longer used after the rename, remove it in a cleanup pass.

