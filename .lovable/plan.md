Right now `/admin/drills` exists and works, but it is only reachable by typing the URL. The side menu only has one Admin entry pointing to `/admin/approval`, so drill management is hidden.

Plan to make admin pages discoverable:

1. Convert the single "Admin" item in `GlobalAppMenu.tsx` into an expandable admin sub-section showing all admin routes:
   - Approval / Brugere
   - Taekwondo Drills / TKD-drills
   - Blog / Blog
   - Clubs / Klubber
   - Payments / Betalinger
   - Module Access / Moduladgang

2. Keep the current top-level icon but add a small chevron; when expanded it reveals the sub-items. Clicking an item navigates and closes the menu, matching existing behavior.

3. Add translation keys for the new menu labels in all 7 languages (en, da, sv, de, ar, no, es).

4. Verify the existing drill page still authorizes only admins and that routing from the new menu works.

No database or backend changes are required; this is purely navigation/UX.