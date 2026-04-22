

## Goals

1. Move messaging out of the Athletes tab into its own dedicated **Messages** tab, so the Athletes tab is no longer cluttered with selection hints, "Select all", per-card message icons, and a floating action bar.
2. Make the **Match Analysis (Video)** help entry actually visible and findable.

## 1. New "Messages" tab in Coach Dashboard

Add a fourth tab `messages` in `src/pages/CoachDashboard.tsx` next to Overview / Athletes / Today.

### Layout of the Messages tab

Single, focused page with three blocks:

- **Header card** — title "Messages" + short description: "Send announcements and reminders to your athletes via email + in-app inbox."
- **Recipient picker** — clean list of all managed athletes with checkboxes, plus a sticky toolbar:
  - Search box (filter by name)
  - "Select all" / "Clear" toggle
  - Live counter: "3 of 12 selected"
- **Composer card** — appears once at least one recipient is selected:
  - Subject input
  - Body textarea
  - Two action buttons: **Send message** (free-form) and **Send reminder** (existing event reminder flow, opens current `SendReminderDialog` pre-filled with selected athletes)
  - Helper text: "Athletes will receive an email and an in-app inbox notification."

This replaces the floating `BulkActionsBar`, the selection hint, the "Select all" button, and the per-card `MessageSquare` icon on the Athletes tab — all of which get removed to declutter.

### Cleanup on the Athletes tab

In `src/pages/CoachDashboard.tsx`:
- Remove the `bulkSelectionHint` callout and the "Select all / Clear" button from the Athletes tab list header.
- Remove the per-athlete `MessageSquare` icon button and the `singleMessageAthlete` state/dialog.
- Remove the `<BulkActionsBar … />` render at the bottom of the Athletes tab.
- Keep the existing checkboxes? **No** — without bulk actions on this tab they have no purpose, so the checkbox column on each athlete card is removed too. Selection state moves entirely into the Messages tab (its own local state).

### Files

- `src/pages/CoachDashboard.tsx` — add `messages` tab, build the new UI, remove the now-orphaned UI from the Athletes tab, drop the `BulkActionsBar` + `singleMessageAthlete` wiring.
- `src/components/coach/SendMessageDialog.tsx` — keep as-is; the new Messages tab reuses it (or inlines the same logic for an embedded composer).
- `src/components/coach/BulkActionsBar.tsx` — no longer rendered. Leave the file in place for now (no breaking removals) but unused.
- `src/i18n/translations.ts` — add new keys across all 6 locales:
  - `messagesTab` ("Messages")
  - `messagesTabDescription`
  - `messagesNoAthletes` ("Add athletes first to send messages.")
  - `recipientsLabel` ("Recipients")
  - `searchAthletes` ("Search athletes…")
  - `selectedCount` ("{n} of {total} selected")
  - `composerTitle` ("Compose message")
  - `sendReminderInstead` ("Send reminder instead")

## 2. Make the Match Analysis help section discoverable

The entry already exists in `src/pages/Help.tsx` and translations, but the user isn't seeing it. Two changes:

- Move the **Match Analysis** topic button to the **top** of the `helpSections` grid (right after `helpProfile`), so it's visible above the fold without scrolling.
- Add a small "New" badge on its topic button until the user opens it once (purely visual, no persistence needed — just a static "New" tag for now).

### Files

- `src/pages/Help.tsx` — reorder `helpSections` array, add "New" badge styling on the Match Analysis tile.
- `src/i18n/translations.ts` — add `newBadge` ("New") in all 6 locales.

## 3. Changelog

Add a new entry under the **2026-04-22** block in `src/pages/Help.tsx` and `translations.ts`:
- "Messages now have their own tab in the Coach Dashboard, with search, select-all, and an inline composer."
- "Match Analysis help section is now featured at the top of the help center."

## Out of scope

- No backend/database changes — `coach_messages`, `send-coach-message` edge function, and the reminder flow stay exactly as they are.
- No changes to athlete-side inbox or the bell dropdown.
- The legacy `BulkActionsBar.tsx` stays in the repo as dead code for now; can be deleted in a follow-up if desired.

