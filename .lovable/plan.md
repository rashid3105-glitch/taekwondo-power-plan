Three small, scoped changes — no logic touched.

### 1) Fix white-on-white text on `/messages` (chat opened from side menu)
File: `src/pages/Messages.tsx`
- Add explicit `text-foreground` to the header "Beskeder" title (line 65).

File: `src/components/chat/ThreadList.tsx`
- Add `text-foreground` to the thread title span (line 92) so it's readable on the light `bg-card` surface.
- Add `text-foreground` to the empty-state center "Vælg en samtale eller start en ny." in `Messages.tsx` (line 100) — keep muted, but acceptable. (Leave as muted-foreground; only the row titles + page heading are broken.)

### 2) Remove the chat icon from the Coach Dashboard header (the circled one)
File: `src/pages/CoachDashboard.tsx`
- Delete `<MessagesIcon isCoach />` on line 350 and remove its import on line 43.
- Chat remains accessible from the side menu and bottom nav.

### 3) Move "Beskeder" (coach → athletes messaging) below "Chat" in the side menu
File: `src/components/GlobalAppMenu.tsx`
- After the existing "Beskeder/Chat" button (lines 274–280) that links to `/messages`, add a new menu item visible only when `isCoach` is true, linking to `/coach/messages` with the `MessageSquare` icon and label `t("messagesTab")` ("Beskeder").
- Update labels: rename the existing `/messages` entry label to "Chat" (use `t("chat")`) to clearly distinguish from the coach "Beskeder" entry below it.

### Result
- Side menu (coach view) order: …Chat → Beskeder (coach→athletes) → Coach Dashboard → Profile …
- Coach header no longer has the duplicate chat bubble icon.
- `/messages` page text is readable.