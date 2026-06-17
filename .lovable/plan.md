## Goal
In the coach dashboard, rename the "KLUB-ATLETER" section to "KLUB-MEDLEMMER", split it into two sub-lists (Atleter and Trænere), and make the whole section collapsible.

## Changes

### 1. Database — extend RPC to expose role
File: new migration `supabase/migrations/<timestamp>_club_member_roles.sql`

Update `public.get_club_member_profiles(_club_id uuid)` to also return an `is_coach boolean` column, computed via `public.has_role(p.user_id, 'coach')`. Keeps existing security checks (caller must be a coach in that club). No grants/RLS changes needed (SECURITY DEFINER function, already executable by authenticated).

### 2. Frontend — `src/pages/CoachDashboard.tsx`
- Extend `AthleteProfile` (local) with optional `is_coach?: boolean`.
- In the `setClubAthletes` block (~line 268-280), pass through `is_coach` from the RPC result.
- Replace the current "Club Athletes" block (lines 499–548) with one collapsible section:
  - Header uses `Collapsible` from `@/components/ui/collapsible` (already in the design system) with a chevron toggle, default **open**.
  - Title: `t("clubMembers")` and total count `(athletes + coaches)`.
  - Sub-heading kept: `t("clubMembersDesc")`.
  - Inside: two subsections, each rendered only if non-empty:
    1. `t("athletes")` (n) — current card grid for members where `!is_coach`.
    2. `t("coaches")` (n) — same card layout for members where `is_coach`; hide the diary button for coaches (coaches don't have a diary view here) and keep the "Skrivebeskyttet" badge.
- Sort each subsection alphabetically by display_name (existing behavior preserved).

### 3. Translations — `src/i18n/translations.ts`
Add new keys for all 7 locales (en, da, sv, de, ar, no, es):
- `clubMembers` (e.g. da: "Klub-medlemmer", en: "Club Members", sv: "Klubbmedlemmar", de: "Vereinsmitglieder", ar: "أعضاء النادي", no: "Klubbmedlemmer", es: "Miembros del club")
- `clubMembersDesc` — reuse current `clubAthletesDesc` wording ("Alle medlemmer i din klub (skrivebeskyttet)" etc.)
- Reuse existing `athletes` and `coaches` keys if present; otherwise add them.

Leave the old `clubAthletes` / `clubAthletesDesc` keys in place (still referenced elsewhere — verified only `CoachDashboard.tsx` uses them, so they can be removed in a follow-up if desired, but keeping avoids accidental misses).

## Out of scope
No changes to data loading, attendance, or any other tab. RLS/grants on other tables unchanged.
