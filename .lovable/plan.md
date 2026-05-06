## Goal

Make the athlete dashboard hub simpler and more action-oriented, matching the mockup. Today's session jumps to the top with a single big Start button. Less scrolling, fewer competing cards, clearer hierarchy.

## What changes (Hub tab only)

### 1. Today's Session — hero card at the top
- Red left border accent, dark card, full-width.
- Top row: small red pill "I DAG · [WEEKDAY]" + a prominent **Start** button (red, with play icon) on the right.
- Title: session focus (e.g. "Teknik, timing og taktik").
- Sub: duration · level (e.g. "60 min · Avanceret").
- Tag chips below for session focus areas (kick / block / movement / etc.) pulled from the active plan's day data.
- Tapping Start → opens today's session detail (same target as today card today). If no plan: shows "Generate plan" CTA in same slot.

### 2. Next Event — slim countdown card
- Blue left accent. Label "NÆSTE STÆVNE".
- Event name + location · date on the left.
- Right side: 3 compact tiles for **DAGE / TIMER / MIN** countdown.
- Tap → `/competitions`.
- Hidden if no upcoming event.

### 3. Recovery strip — single row
- Compact row with green pulse icon + "RECOVERY" label.
- Three inline metrics: **RHR**, **HRV**, **SØVN** (each as a big number + small unit/label, em-dash if missing).
- Replaces the current `ReadinessCard` + `RecoveryTile` stack on the hub (those components stay available elsewhere but we render this one consolidated strip on the hub).

### 4. Pinned modules — 2×2 grid
- Default pins: **Træningsplan**, **Fremgang**, **Konkurrencer**, **Match-analyse**.
- Each tile: colored icon chip top-left, bold title, one-line status sub (e.g. "Uge 22 aktiv", "3 metrics opdateret", "President Cup", "2 klip klar").
- Section header "FASTGJORTE MODULER" with right-aligned link **"Alle moduler →"** that scrolls to / reveals the rest.
- (Stretch, not required v1) make pins user-customizable; for v1 hardcode the four above.

### 5. Other modules — chip row
- Header "ØVRIGE MODULER".
- Horizontal scroll chip row: **Mental**, **Ernæring**, **Skade**, **Test**, **Sæsonplan**, **Bibliotek**.
- Each chip = pill button with small icon + label, taps to the same destinations the current grid uses.

### 6. Removed / demoted on hub
- Big greeting block with avatar, belt, daily quote → removed from hub (greeting kept as a small line above the Today card; quote moves to a less prominent slot or is dropped from hub — recommend dropping to reduce noise).
- `WhatsNewInline`, `EnablePasskeyCard`, `ReflectionPromptCard` → moved out of the main flow into a collapsible "Mere" / dismissible inbox-style section at the bottom (or shown only when actionable, e.g. passkey only if not enabled, reflection only if pending).
- Current 6-tile module grid + Competitions/Season buttons → replaced by the pinned 2×2 + chips above.

### 7. Header / nav
- No change to the slim sticky header or bottom mobile nav. The new layout simply replaces the hub body.

## Why this simplifies things

- One clear primary action per visit: **Start today's session**.
- Status (next event countdown, recovery numbers) is glanceable in <2 seconds.
- Module access goes from a long scrolling grid to 4 pinned + chip row → less visual weight.
- Removes redundant cards (separate readiness + recovery + today + greeting + quote → unified).

## Technical notes

Files to touch:
- `src/pages/Dashboard.tsx` — replace the hub branch (`activeTab === "hub"` block, ~lines 587–810). Keep all other tabs untouched.
- New small components under `src/components/hub/`:
  - `TodaySessionHero.tsx` (consumes active plan + today's day)
  - `NextEventCountdown.tsx` (consumes existing `nextEvent` state, computes d/h/m)
  - `RecoveryStrip.tsx` (reuses data sources behind `ReadinessCard` / `RecoveryTile` — RHR, HRV, sleep)
  - `PinnedModulesGrid.tsx` (4 hardcoded tiles + status sub-text)
  - `OtherModulesChips.tsx`
- `src/i18n/translations.ts` — add keys: `todayLabel`, `startSession`, `nextEventTitle` (exists), `daysShort`, `hoursShort`, `minutesShort`, `recovery`, `sleepShort`, `pinnedModules`, `allModules`, `otherModules`, plus module status strings. Add DA/EN/SV/DE/AR.
- Reuse existing color tokens (`tab-plan`, `tab-progress`, `tab-rehab`, `tab-mental`, `tab-nutrition`, `explosive`, `primary`). No new colors.
- No backend / schema changes.

## Out of scope

- Customizable pinned modules (v2).
- Changes to non-hub tabs, coach view, header, or bottom nav.
- Wearable integration changes — recovery strip just reads what's already there and shows em-dash when missing.

## Mockup parity check

Mockup element → plan section:
- Red "I DAG · ONSDAG" pill + Start → §1
- "Teknik, timing og taktik" + chips → §1
- "NÆSTE STÆVNE" with 30 DAGE / 08 TIMER / 44 MIN → §2
- Recovery row 79 RHR / 35 HRV / — SØVN → §3
- "FASTGJORTE MODULER" 2×2 → §4
- "ØVRIGE MODULER" chips → §5
