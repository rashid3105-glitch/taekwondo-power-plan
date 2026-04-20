
The user generated a competition plan and got "Plan generated" toast but doesn't see the actual plan content on the card. Let me investigate.

Looking at `src/pages/Competitions.tsx`, after generation it only renders:
- `c.plan_data?.warnings` (array of warning strings)
- `c.plan_data?.taperSummary` (single string)

But the edge function returns a rich JSON with `weeklyTaper`, `weightCut`, `nutritionAdjustments`, `peakDayProtocol`. None of these are displayed.

From the session replay, the British Open card DOES show warnings ("Cutting 3.0 kg in 5 days...") which means `plan_data` is populated. But there's no taper summary visible and no detail view at all.

Let me check the actual stored plan_data to confirm what AI returns.
