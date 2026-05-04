
# Coach Dashboard 2.0 + Athlete Overview Page

## Goal
Keep the **Squad Overview** as the entry point for coaches (it's already strong), but make it act as a true **command center** that links into a **dedicated, deep Athlete Overview page** — replacing today's cramped tab-inside-a-tab modal/drawer experience in `CoachDashboard.tsx`.

## Why this is an improvement
Today's flow:
- Coach lands on `/coach` → squad list.
- Tapping an athlete opens a **Drawer/Dialog** containing `CoachAthleteDetail` (572 lines, 8+ inner tabs: Profile, Plan, Rehab, Mental, Reflections, Tests, Form, Notes…).
- Heavy nested scrolling, no deep links, no back button, can't share an athlete URL with a co-coach, charts get squeezed into a 90vh sheet.

Pain points:
1. **No URL per athlete** → can't bookmark, share, or refresh into a specific athlete.
2. **Drawer is too small** for graphs (FormCurve, recovery trend, test comparison are all rendered at ~400px wide on mobile, ~600px on desktop).
3. **No "at-a-glance" header** — coach has to click through tabs to learn anything.
4. **No cross-athlete trends** on the dashboard itself (sparklines, deltas, alerts).
5. The team overview mixes 5 different jobs (squad, pulse, attendance, messages, exports, pending) into one giant page.

## Proposed architecture

```text
/coach                          ← Command Center (entry point, kept)
  ├─ Top KPI strip              (squad size, attention count, injured, no-plan, avg readiness 7d)
  ├─ Smart Alerts feed          (auto-surfaced: low readiness streak, missed sessions, new PRs)
  ├─ Squad grid (existing)      ← redesigned cards with sparklines + status dots
  └─ Side rails: Pending · Messages · Quick actions

/coach/athlete/:athleteId       ← NEW dedicated Athlete Overview (full page)
  ├─ Sticky header
  │   avatar · name · belt · club · discipline · country
  │   status chips (active plan ✓ / injury ⚠ / last seen)
  │   primary actions: Send message · Send reminder · Edit profile · View diary
  ├─ Overview tab (default)
  │   ┌─────────────────────────┬─────────────────────────┐
  │   │ Form curve (12w, large) │ Readiness 14d trend     │
  │   ├─────────────────────────┼─────────────────────────┤
  │   │ Sessions logged vs      │ Mood × Energy heatmap   │
  │   │ planned (8w bars)       │ (last 30d)              │
  │   ├─────────────────────────┴─────────────────────────┤
  │   │ Physical test radar vs club median                │
  │   ├───────────────────────────────────────────────────┤
  │   │ Upcoming competitions + season phase pill         │
  │   └───────────────────────────────────────────────────┘
  ├─ Plan / Rehab / Mental / Reflections / Tests / Notes
  │   (existing CoachAthleteDetail tabs, now full-width)
  └─ Diary side-panel (slide-in, not modal)
```

The `/coach` page stays as the entry point — clicking an athlete card now `navigate('/coach/athlete/' + id)` instead of opening a Drawer.

## Concrete UI improvements

**Squad cards (on `/coach`):**
- Add a 7-day readiness sparkline (already have data via `get_squad_overview`)
- Status dot color: green (on plan + recent activity) / amber (stale 3-7d) / red (stale >7d or low readiness streak)
- Hover/tap reveals quick actions inline (message, reminder) without opening anything
- Sort presets: Needs attention · Recently active · Alphabetical · Belt rank

**Smart Alerts feed (new, top of `/coach`):**
- Auto-generated cards: "3 athletes haven't logged in 5+ days", "Mette's readiness dropped 30% this week", "New PR: Jonas — bench 95kg"
- Click → jumps directly to that athlete's Overview page with the relevant tab pre-selected

**Athlete Overview page:**
- Real estate for charts: each visualization gets full width on mobile, half on desktop (vs. cramped tabs today)
- Shareable URL `/coach/athlete/:id` → opens directly to that athlete (deep link from email, push notification, or co-coach)
- Persistent header with quick actions = fewer clicks per session
- Sub-tabs use `?tab=plan` query param so back/forward works
- Diary becomes a slide-in side panel, not a separate modal — coach can see context while reading

## Technical approach

- **New route:** `/coach/athlete/:athleteId` in `App.tsx`, gated by coach role + `users_share_club` / `coach_athletes` check
- **New page:** `src/pages/CoachAthleteOverview.tsx` — wraps the existing `CoachAthleteDetail` tabs but adds the new Overview tab + sticky header
- **New component:** `src/components/coach/AthleteOverviewTab.tsx` — orchestrates the 5 charts (FormCurve, recovery trend, sessions vs planned bars, mood/energy heatmap, test radar)
- **New component:** `src/components/coach/SmartAlertsFeed.tsx` — derives alerts from existing `get_squad_overview` + `get_athlete_recovery_trend` data; no new DB needed
- **Refactor:** `CoachDashboard.tsx` — replace Drawer/Dialog detail rendering with `navigate()`; trim the file by ~200 lines
- **Reuse:** `CoachAthleteDetail` becomes the tab body for non-Overview tabs (Plan/Rehab/Mental/etc.) — minimal changes inside it
- **Data:** No DB migrations required for v1. All data is already exposed via existing RPCs (`get_squad_overview`, `get_athlete_recovery_trend`, `get_club_test_medians`, `compute_form_curve`)
- **i18n:** Add ~15 new translation keys across DA/EN/SV/DE/AR/NO

## Out of scope (v1)
- Comparing two athletes side-by-side
- Coach-defined custom alert rules
- Exporting an athlete one-pager PDF (good v2)
- Realtime presence ("athlete is logging right now")

## Open questions for you
1. **Default landing tab on the Athlete page** — Overview (charts) or Plan (action-oriented)?
2. **Smart Alerts** — show on `/coach` top, or as a bell-icon dropdown to keep the squad grid above the fold?
3. **Mobile** — full page navigation feels right for tablets; on phone do you still want a drawer for quick peeks, or always full-page?
