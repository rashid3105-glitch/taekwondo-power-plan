## 1) Chat header — remove "Åbn" and fix the overlapping X

**What's happening today**
In `src/components/chat/ChatDrawer.tsx`, the header has three buttons: group, new chat, and **"Åbn"**. The "Åbn" button closes the drawer and navigates to `/messages` (the full-page chat view). Most users won't understand that — it just looks like a stray button next to the X close icon that the Sheet component automatically renders in the top-right corner. That's why they visually collide.

**Proposed fix**

- Remove the "Åbn" button entirely. The drawer already shows all threads and conversations — a separate full-page route is redundant for the in-app drawer.
- This also resolves the visual overlap with the built-in X.
- Keep the `/messages` route reachable from elsewhere (it's still linked from notifications and direct URLs), we're only removing the button from the drawer header.
- Also remove the now-unused `useNavigate` import.

Alternative (if you'd rather keep the full-page link): move "Åbn" to a small text link inside the empty state of the thread list instead of the header. Let me know which you prefer.

## 2) Why parents don't show up in "Tilføj personer"

The dialog calls `getChattableContacts()` in `src/lib/chatApi.ts`. Parents are only returned in two cases:

- **You are a coach** → parents linked to athletes in your `coach_athletes` table are included.
- **You are an athlete** → only *your own* parents (rows in `parent_athletes` where `athlete_id = you`) are included.

So a parent is **not** suggested when:

- You're an athlete trying to add another athlete's parent (intentional — privacy).
- You're a coach but the athlete-parent link doesn't exist in `parent_athletes`.
- The parent is **already a member of the thread** — the dialog filters out `existingMemberIds`. If the parent was auto-added when the group was created, they won't reappear here.
- The parent has no profile row matching `user_id`, or their display_name is null (they'd show as "Unknown (P)" — still listed, but easy to miss).

**To confirm which case applies**, tell me:

- Are you logged in as a coach or an athlete in this test?
- Is the parent already a member of this specific group thread?
- Does the parent have an active account (registered through ParentJoin)?

I am logged in as a coach AND an admin  
the parent is a parent to one of my athletes (Kian Rashid), so I should be able to add the parent

Once I know which case it is, I can propose a targeted fix (e.g. let coaches add any parent in their club, or surface "no eligible parents" messaging).

## Files to change (for part 1)

- `src/components/chat/ChatDrawer.tsx` — remove "Åbn" button + `useNavigate` import.

No DB or backend changes.