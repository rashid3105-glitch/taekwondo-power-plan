

## Plan: Club-grouped approved users & visual improvements

### Changes to `src/pages/AdminApproval.tsx`

1. **Remove the sort dropdown** (lines 794-802) — no longer needed since approved users are always club-grouped and pending stays flat.

2. **Remove `sortBy` state** (line 67) and the `sortedFiltered` logic (lines 400-407) — just use `filteredUsers` directly.

3. **Approved section: always use `groupByClub`** (lines 836-857) — remove the conditional, always render club-grouped view. Enhance the club group headers visually:
   - Add a colored left border or background to each club group
   - Show athlete count vs. `max_athletes` from the clubs array (e.g. "3 / 5 athletes")
   - Use `Building` icon instead of `Users` in club headers

4. **Pending section stays flat** — no changes to the pending list (lines 809-823).

5. **Visual enhancements for club groups**:
   - Each club group gets a subtle card wrapper with a left accent border
   - Club header shows club name prominently with member count badge
   - "No club" group styled differently (muted/warning style)

### Technical details

- Remove `sortBy` state and its `Select` component
- Replace the conditional render block (lines 836-857) with always-on `groupByClub(approved)` rendering
- Look up `max_athletes` from `clubs` state by matching club name to show capacity
- Add `groupByClub` enhancement to include `clubId` for capacity lookup

