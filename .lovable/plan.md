## 1) Shared coach notes per club (admin-controlled)

Today every coach has fully private notes on each athlete (`coach_athlete_notes`, RLS: only the owning coach can read/write). We'll let an admin flip a per-club switch that lets all coaches in that club read each other's notes on athletes from that club. Writes stay private to the author (each coach still owns and edits only their own note row), so we get a transparent shared view without anyone overwriting another coach's text.

### Database
- Add `clubs.share_coach_notes boolean not null default false`.
- New SECURITY DEFINER helper `public.club_shares_coach_notes(_club_id uuid) returns boolean`.
- Add an extra SELECT policy on `coach_athlete_notes`: a coach may read another coach's note when (a) the reader has the `coach` role, (b) reader and note's coach share a club, (c) reader and the athlete share that same club, and (d) that club has `share_coach_notes = true`.
- Existing "Coaches manage own notes" policy is unchanged → no one can edit another coach's note.

### Admin UI (`src/pages/AdminClubs.tsx`)
- Add a "Share coach notes" `Switch` to each club row, next to `max_athletes`.
- Toggling updates `clubs.share_coach_notes` and shows a toast.
- New translations: `shareCoachNotes`, `shareCoachNotesHint`.

### Coach UI (`src/components/coach/CoachNotes.tsx`)
- Keep the existing editable textarea (the coach's own note).
- When the athlete's club has sharing enabled, fetch all other coaches' notes for this athlete and render them below as read-only cards: coach display name + timestamp + content.
- Small badge "Shared in club" so coaches understand visibility.

---

## 2) Better Health graphs with norm baselines (`src/pages/Health.tsx`)

Today Steps/Sleep/RHR/HRV are plain bars; only RHR/HRV have a personal 7-day baseline line. We'll keep the personal baseline and add a fixed "healthy adult athlete" norm band so every chart has context, plus richer detail.

### Norm reference values (constants in a new `src/lib/healthNorms.ts`)
- Steps: target 10 000/day, low 5 000.
- Sleep: target 8h, low 7h, high 9h (band).
- RHR: athlete band 50–65 bpm.
- HRV (RMSSD): athlete healthy ≥ 50 ms, low < 30 ms.

### Chart upgrades (each metric card)
- Switch the per-metric charts from `BarChart` to `ComposedChart`:
  - Bars (or area for sleep) for the daily value.
  - `ReferenceArea` for the healthy norm band, soft `--muted` fill.
  - `ReferenceLine` for the target value, dashed `--primary`.
  - Existing personal 7-day baseline line stays for RHR / HRV.
- Tooltip: show value, delta vs 7-day avg, and "vs norm" label (Below / In range / Above).
- Add a small legend row under each chart explaining the band and target line.
- Increase chart height from `h-40/44` to `h-56` for readability on mobile.
- Steps card: add a weekly total stat tile alongside today / 7-day avg.

### 7-day overview card
- Keep the normalized 0–100 % multi-line view, but add a horizontal `ReferenceLine` at 100 % marked "Personal max in window" so users understand what the normalization means.

No backend changes for part 2 — the data already exists in `wearable_daily_summary`.

---

## Files to touch

- `supabase/migrations/<new>.sql` — add column, helper function, extra SELECT policy.
- `src/pages/AdminClubs.tsx` — Switch + update handler.
- `src/components/coach/CoachNotes.tsx` — read & render other coaches' notes when shared.
- `src/i18n/translations.ts` — new keys for admin toggle, "Shared in club" label, norm legends.
- `src/lib/healthNorms.ts` — new constants module.
- `src/pages/Health.tsx` — ComposedCharts + ReferenceArea/Line + richer tooltips/stats.

## Open question

For shared club notes: should an athlete also see all coach notes about them when sharing is on, or keep notes coach-only (current behavior)? Default in this plan: still coach-only; athletes never see them.
