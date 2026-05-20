## Problem

On the iPhone app (Capacitor), two issues on `/messages`:

1. **No way to exit the chat.** When a conversation is open on mobile, `src/pages/Messages.tsx` hides the thread-list pane and shows `Conversation`. The page header (with the ArrowLeft → `/dashboard`) is `sticky top-0`, but the main grid uses `h-[calc(100vh-56px)]` which on iOS WebView doesn't subtract the dynamic safe area / status-bar overlay correctly. The result: the page header is pushed off-screen or obscured by the status bar, and the only remaining back arrow lives inside `Conversation` and is `md:hidden`-conditioned to return to the thread list — never to leave the chat page entirely.

2. **Layout jumps on input focus.** Tapping the `Textarea` in `MessageComposer` triggers the iOS keyboard. Because the page uses `100vh` (static viewport height) and the composer/list rely on `flex-1` + `ScrollArea`, the keyboard pushes/resizes the whole page: the sticky header scrolls away, the message list collapses, and the composer drifts. There is no Capacitor Keyboard handling and no `100dvh` / `--app-height` strategy.

## Fix

### 1. Always-visible exit from a conversation on mobile

In `src/components/chat/Conversation.tsx`, change the back-button behavior so on mobile it does two jobs depending on context:
- If invoked from `Messages.tsx` (page), tapping back should navigate out to `/dashboard` (close the chat entirely), not just clear the active thread.
- Solution: add a second button — a **Close (X)** icon next to the existing ArrowLeft — that calls a new optional `onExit` prop. `Messages.tsx` passes `onExit={() => navigate("/dashboard")}`. ArrowLeft still calls `onBack` (back to thread list). Both are visible on mobile, hidden on `md:`.
- Also drop the `md:hidden` on the ArrowLeft so the back affordance is always there on the conversation header (consistent UX), and add `pt-safe` to the conversation header so it sits below the iOS status bar even if the page header is clipped.

### 2. Stable layout when the keyboard opens

- In `src/pages/Messages.tsx`, replace `h-[calc(100vh-56px)]` with `h-[calc(100dvh-56px)]` and add `min-h-0` on the grid + child panes so flex children don't overflow. Use `dvh` so iOS Safari/WebView shrinks the area when the keyboard appears instead of pushing the whole page up.
- Set the outer wrapper to `h-[100dvh] overflow-hidden` (replacing `min-h-screen`) so the page itself never scrolls — only the message `ScrollArea` does. This stops the sticky header from disappearing on focus.
- In `src/components/chat/MessageComposer.tsx`, keep `pb-safe` and add a small `onFocus` handler that scrolls the latest message into view after the keyboard animation (`setTimeout(..., 250)`), so the newest messages stay visible above the keyboard.
- Install and wire the Capacitor Keyboard plugin lightly: in `src/main.tsx` (or a small `useIosKeyboard` hook called from `Messages.tsx`), if `Capacitor.isNativePlatform()`, set `Keyboard.setResizeMode({ mode: 'native' })` and `setScroll({ isDisabled: true })`. This makes iOS resize the WebView itself instead of scrolling the page, which combined with `100dvh` removes the "screen changes format" jump.

### Files touched
- `src/pages/Messages.tsx` — `100dvh`, `overflow-hidden`, pass `onExit` to `Conversation`, optional `useIosKeyboard` hook.
- `src/components/chat/Conversation.tsx` — add `onExit` prop, render Close (X) button on mobile, `pt-safe` on header, always-visible ArrowLeft.
- `src/components/chat/MessageComposer.tsx` — onFocus scroll-into-view nudge.
- New `src/hooks/useIosKeyboard.ts` (optional, ~15 lines) — Capacitor Keyboard config; no-op on web.
- `package.json` — add `@capacitor/keyboard` if not already present (verify before installing).

No backend, schema, or business-logic changes. Purely presentation + native-shell behavior.
