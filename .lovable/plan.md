Plan:

1. Fix the reminder source on `/dashboard`
   - Change the monthly mental reminder check so it waits for role loading to finish before deciding athlete vs coach table.
   - For users with coach/admin role, check `coach_mental_assessments` only.
   - For athlete-only users, check `mental_assessments` only.
   - Prevent the card from briefly showing while the check is still unresolved.

2. Make the reminder update immediately after completion
   - When returning to the hub after submitting a coach mental review, force a fresh server check instead of relying on stale role/query state.
   - Keep the existing 30-day rule: any completed assessment within the last 30 days hides the card.

3. Keep scope narrow
   - Do not change the question flow, advice generation, history, or coach/athlete role structure.
   - Only adjust the dashboard reminder gating and navigation target if needed.

4. Validate
   - Confirm the dashboard logic reads the correct table for Farooq's coach/admin role.
   - Confirm the reminder card is hidden when a recent coach review exists and only returns after 30 days.