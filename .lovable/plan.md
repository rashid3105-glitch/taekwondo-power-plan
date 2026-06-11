## Goal
Let coaches copy the current week's "Holdets fokus" (techniques + trænernote) to up to 4 other weeks in the same season plan.

## UI
In `src/pages/SeasonCalendar.tsx`, in the week focus editor (around line 1024, right next to the `Gem` button):

- Add a secondary button `Kopiér fokus til andre uger` (outline variant) beside `Gem`.
- Clicking it opens a Popover with:
  - A short helper line: "Vælg op til 4 uger" (max 4).
  - A scrollable list of checkboxes for every other week in the plan (`1..totalWeeks` minus the current `sw`), labeled `Uge N · yyyy-mm-dd – yyyy-mm-dd` (reuse the same date math used elsewhere in this file).
  - Disable unchecked checkboxes once 4 are selected.
  - Footer with "Annullér" and a primary "Kopiér til X uge(r)" button (disabled when 0 selected).
- On confirm: call a new `copyWeekFocusTo(sourceWeek, targetWeeks[])` helper, close the popover, clear selection, toast `t("seasonTechFocusCopied") || "Fokus kopieret til X uge(r)"`.

## Logic
New helper in the same file:

```
async function copyWeekFocusTo(sourceWeek: number, targetWeeks: number[]) {
  if (!selectedPlanId || !userId || targetWeeks.length === 0) return;
  const src = weekFocusMap.get(sourceWeek);
  if (!src) return;
  const rows = targetWeeks.map((w) => ({
    season_plan_id: selectedPlanId,
    season_week: w,
    technique_ids: src.technique_ids,
    coach_note: src.coach_note,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }));
  const { data } = await (supabase.from as any)("club_week_technique_focus")
    .upsert(rows, { onConflict: "season_plan_id,season_week" })
    .select();
  // Merge results back into weekFocusMap so UI reflects copies immediately
  setWeekFocusMap((prev) => {
    const next = new Map(prev);
    for (const row of (data ?? []) as any[]) {
      next.set(row.season_week, {
        id: row.id,
        technique_ids: row.technique_ids ?? [],
        coach_note: row.coach_note ?? "",
      });
    }
    return next;
  });
  toast({ title: (t("seasonTechFocusCopied") || "Fokus kopieret") + ` (${targetWeeks.length})` });
}
```

Guardrails:
- Hard-cap selection at 4 in the UI (no server-side change needed).
- If current week has empty `technique_ids` and empty `coach_note`, disable the copy button with tooltip "Ingen fokus at kopiere".

## i18n
Add to `src/i18n/translations.ts` in all 7 locales (en, da, sv, de, ar, no, es):
- `seasonCopyFocus` — DA: "Kopiér fokus til andre uger", EN: "Copy focus to other weeks", etc.
- `seasonCopyFocusHelp` — DA: "Vælg op til 4 uger", EN: "Pick up to 4 weeks".
- `seasonCopyFocusConfirm` — DA: "Kopiér til {n} uger", EN: "Copy to {n} weeks" (use simple string replace on `{n}`).
- `seasonTechFocusCopied` — DA: "Fokus kopieret", EN: "Focus copied".
- `cancel` if not already present (reuse if it is).

## Files changed
- `src/pages/SeasonCalendar.tsx`
- `src/i18n/translations.ts`

No DB changes, no edits to athlete view.