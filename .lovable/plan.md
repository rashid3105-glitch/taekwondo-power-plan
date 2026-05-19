## Add members to existing group chat

The chat header currently has no action button in the top-right of an open conversation (where you circled). I'll add a "+ Add people" button there, visible only for group threads. The backend RPC `add_chat_group_member(_thread, _user)` already exists, so no DB migration is needed.

### Changes

**1. `src/lib/chatApi.ts`**
- Add helper `addGroupMember(threadId, userId)` wrapping the existing `add_chat_group_member` RPC.

**2. `src/components/chat/Conversation.tsx`**
- In the header, when `thread.kind === "group"`, render a `UserPlus` icon button on the right side (matching the spot circled in the screenshot).
- Clicking it opens a new `AddMembersDialog` (below).
- Refresh thread after a member is added so the count updates.

**3. `src/components/chat/AddMembersDialog.tsx` (new)**
- Dialog listing `getChattableContacts()` filtered to exclude users already in the thread.
- Multi-select with checkboxes (same styling as `NewGroupDialog`), grouping coaches / athletes / parents, with the same amber parent warning banner.
- "Tilføj" button calls `addGroupMember` for each selected user in parallel, shows a sonner toast, then closes and triggers refresh.

### Notes
- Only shown for groups (direct threads stay 1:1).
- No permission changes — RLS on `add_chat_group_member` already governs who can add.
- No translation strings needed beyond Danish inline labels, matching the rest of the chat UI.
