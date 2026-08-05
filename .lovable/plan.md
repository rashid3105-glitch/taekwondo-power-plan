# Fix: chat cannot be used (message box is hidden)

## What is wrong

On the Beskeder page the message input box exists but is not visible or tappable — it sits underneath the persistent bottom menu bar.

Evidence:
- The Beskeder page is built as a full-screen (100dvh) column: header, message list, then the composer at the very bottom.
- The persistent bottom navigation bar added recently is fixed to the bottom of the screen, floating on top of the page, and the Beskeder page reserves no space for it. The composer therefore lands behind it.
- The Beskeder route is not in the list of routes that hide the bottom nav.
- In the backend, no chat message has been written since 23 July, which matches the period after the persistent bottom nav was introduced. So chat itself (database, permissions, realtime) is fine — it is purely that nobody can reach the send box.

## What will be done

1. Hide the persistent bottom navigation on the Beskeder page. Chat is a focused full-screen view with its own back/close buttons, so the app menu is not needed there.
2. As a safety net, make the chat layout reserve space at the bottom (bottom-nav height plus the iPhone safe area) so the composer is never covered, also inside the floating chat drawer where the nav can still be visible.
3. Verify the same overlap does not affect other full-height screens with a fixed bottom element (chat drawer, diary composer, any page using 100dvh with a bottom action bar) and apply the same bottom spacing where it does.
4. Send a test message end-to-end after the fix to confirm the message appears in the thread and is stored.

## Technical notes

- `src/components/AppBottomNav.tsx`: add `/messages` to the hidden prefixes.
- `src/pages/Messages.tsx` / `src/components/chat/Conversation.tsx`: ensure the composer container carries bottom padding using the existing safe-area utility so it clears any fixed bar.
- No database, RLS, or edge function changes — the chat backend is verified working.
