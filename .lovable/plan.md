

## Why you can't see the messaging feature

The **Send message** and **Remind** functionality is built and deployed, but it's hidden behind two non-obvious steps:

1. It only appears on the **Athletes** tab (not Overview or Today)
2. A floating action bar only appears *after* you check at least one athlete's checkbox

There's no label explaining the checkboxes, no "Select all", and no way to message a single athlete from their card. That's why the feature feels invisible.

## Plan to fix discoverability

### 1. Add an instruction line above the athlete list
On the **Athletes** tab, above the "My Athletes" section, add a short hint like:
> "Tick athletes below to send messages, reminders, or generate plans in bulk."

Shown only when there's at least one managed athlete, hidden once a selection is active.

### 2. Add "Select all / Clear" toggle
Next to the "My Athletes (N)" header, add a small button:
- "Select all" when none/some are selected → selects every managed athlete
- "Clear" when all are selected → clears the selection

This makes the bulk-action pattern obvious and lets coaches message everyone in one click.

### 3. Add a per-athlete "Message" quick action
On each managed athlete card (next to the existing Diary `NotebookPen` and Manage `UserCog` icons), add a `MessageSquare` icon button. Clicking it:
- Pre-selects only that athlete
- Opens the same Send Message dialog from `BulkActionsBar`

This requires lifting the message dialog state up, OR exposing a small imperative handle. Simplest: extract a small `SendMessageDialog` component reused in both places.

### 4. Make the floating bar more visible when it appears
Currently `sticky bottom-2` with subtle border. Add a subtle slide-up animation and increase the contrast of the border so the bar is unmistakable when selections are made.

### 5. Add the same hint to the Help page
Append a short note to the `helpAddStudentsSteps` (already mentions step 8 about messaging) clarifying the exact UI flow: "Open the **Athletes** tab → tick the checkboxes next to athletes → use the floating action bar at the bottom of the screen."

## Files that will change

- `src/pages/CoachDashboard.tsx` — add hint text, Select-all toggle, per-card Message button, lift dialog state if needed
- `src/components/coach/BulkActionsBar.tsx` — extract `SendMessageDialog` so it can be triggered from a single-athlete context; add slide-in animation
- `src/i18n/translations.ts` — new keys: `bulkSelectionHint`, `selectAll`, `clearSelection`, `messageAthlete` across all 6 locales (EN/DA/SV/DE/AR/NO)
- `src/pages/Help.tsx` (and translation step 8) — clarify the selection step

## Out of scope

- No backend or schema changes (the `coach_messages` table, `send-coach-message` edge function, and email pipeline are already live and working).
- No changes to the existing Inbox bell on athlete dashboards — that already works correctly.

