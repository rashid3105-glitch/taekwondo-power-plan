# Fix Radix Dialog accessibility warning

## Problem
Radix UI logs a warning whenever a `<DialogContent>` is rendered without a `<DialogDescription>` or an explicit `aria-describedby`. Many dialogs in the project (e.g. `SendReminderDialog`, `SendMessageDialog`, `CompetitionPlanDialog`, `ExercisePicker`, `CommandDialog`, etc.) only render a title, so the warning fires repeatedly in the iOS Xcode console.

This is purely an accessibility warning — nothing is broken — but it clutters logs and is a real a11y gap for screen-reader users.

## Approach
Patch the shared UI primitive once, instead of editing ~15 dialogs.

In `src/components/ui/dialog.tsx`, update `DialogContent` to:

1. Accept an optional `aria-describedby` prop (already supported by Radix).
2. If no `aria-describedby` is passed by the caller AND no `<DialogDescription>` is found in `children`, render a visually-hidden default `<DialogDescription>` so Radix has something to associate.
3. Use a stable generated id (`React.useId()`) and wire it via `aria-describedby` so screen readers still get a sensible (empty) description and the warning disappears.

Implementation sketch:

```text
const generatedId = React.useId();
const describedById = props["aria-describedby"] ?? generatedId;

<DialogPrimitive.Content aria-describedby={describedById} ...>
  {children}
  <DialogPrimitive.Description id={generatedId} className="sr-only" />
  ...
</DialogPrimitive.Content>
```

Notes:
- The hidden `<DialogPrimitive.Description>` is always rendered but is empty + `sr-only`, so it has zero visual impact.
- Dialogs that already include their own `<DialogDescription>` keep working — the hidden one is harmless (Radix only requires that `aria-describedby` points to *an* element).
- No other files need to change. Existing `<DialogContent>` usages across the app (SendReminderDialog, SendMessageDialog, AlertDialog flows that use `Dialog`, CommandDialog wrapper, etc.) are fixed automatically.

## Out of scope
- Writing real, meaningful descriptions per dialog. That's a content task we can do separately if you want better screen-reader UX; this plan only silences the warning and provides a safe default.
- `AlertDialogContent` (separate primitive in `alert-dialog.tsx`). Radix doesn't emit the same warning there, but if you want, I can apply the same pattern in a follow-up.

## Files touched
- `src/components/ui/dialog.tsx` (only file)
