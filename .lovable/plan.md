## Goal

Lock the **Profile & Plan** tab by default and add a **pencil icon** in the top-right corner that toggles edit mode. While locked, all inputs/buttons are disabled (read-only); when unlocked, the user can edit and save as today.

## Scope

File: `src/components/CoachAthleteDetail.tsx` (Profile & Plan tab only — Mental, Performance, Activity tabs unaffected)

Sections to lock:
- Athlete Profile (age, weight, belt, experience, discipline, country, Save button)
- Weekly Schedule (`WeekSchedulePicker` + Save button)
- Training Goals (selectable chips)
- Program Length (slider)
- Training Plan (Generate Plan button — `AIPlanCard` view stays visible)
- Injury Rehab Plan (description input + Generate button — existing plan card stays visible)

## Approach

1. Add local state `const [editing, setEditing] = useState(false);` near other state.
2. Place the pencil toggle in the **tab header row** (top-right, aligned with the athlete name) so it sits in the upper-right corner of the Profile & Plan view. Use `Pencil` icon (locked) / `Lock` icon when in edit mode, or just toggle with a tooltip. A `Badge` or subtle label "Read only" / "Editing" gives clarity.
3. In the `TabsContent value="profile"` block, gate interactivity:
   - Pass `disabled={!editing || savingProfile}` etc. to all `Input`, `Select`, `Slider`, `Button`, and goal-chip buttons.
   - The chip buttons need `disabled:opacity-60 disabled:cursor-not-allowed` styling.
   - Wrap `WeekSchedulePicker` in a `<fieldset disabled={!editing}>` (or pass a `disabled` prop if supported — fieldset is safer and requires no component change).
4. The pencil button only affects this tab. Switching tabs or unmounting resets state naturally.
5. Add 2 translation keys in `src/i18n/translations.ts` for all 5 languages: `editProfile` ("Edit"), `lockProfile` ("Lock") — or reuse existing `edit` / `save` keys if present.

## Visual

```text
┌─────────────────────────────────────────────────┐
│  Athlete Name                  [✏️ Edit]  [Bell] │  ← pencil here
├─────────────────────────────────────────────────┤
│  [Profile&Plan] [Mental] [Performance] [Activity]│
├─────────────────────────────────────────────────┤
│  Athlete Profile        (inputs greyed out)     │
│  Weekly Schedule        (greyed)                │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

When pencil is tapped → icon swaps to a lock, fields become editable, Save buttons enable.

## Out of scope

- No changes to data model or RLS.
- No change to Mental / Performance / Activity tabs.
- The pencil only affects the Profile & Plan tab; viewing data (e.g. existing plan card, rehab card) remains visible at all times.
