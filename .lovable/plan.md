## Problem

On iOS (TestFlight), opening a chat thread has two bugs:

1. **Page zooms in** when the message textarea gets focus. iOS WKWebView auto-zooms into any form field whose computed `font-size` is below 16px. Our `Textarea` component (`src/components/ui/textarea.tsx`) uses `text-sm` = 14px, so every focus triggers the zoom.
2. **User can't see what they're typing.** The composer sits below the keyboard. `src/pages/Messages.tsx` wraps the whole screen in `min-h-[100dvh]` with `flex flex-col`. `min-h` lets the container grow taller than the visible viewport when the native keyboard resizes the WebView, so the sticky header stays visible but the flex-1 main area (with the composer at its bottom) overflows below the keyboard. Combined with the zoom, the composer ends up completely off-screen.

## Fix (frontend only, minimal)

### 1. `src/components/chat/MessageComposer.tsx`
Force the chat textarea to ≥16px so iOS never zooms, without changing any other Textarea in the app:
- Add `text-base` (16px) to the existing `className` on the `<Textarea>` (line 171). Keep `min-h-[44px] max-h-32 flex-1 resize-none` as-is.
- Remove the `onFocus` `scrollIntoView` handler (lines 172–178). With the height fix below the composer stays in view naturally, and `scrollIntoView` on iOS often causes the "page jumps up" effect the screenshot shows.

### 2. `src/pages/Messages.tsx`
Change the outer wrapper so it exactly matches the (keyboard-resized) viewport instead of being allowed to grow past it:
- Line ~85: replace `min-h-[100dvh] bg-background flex flex-col` with `h-[100dvh] bg-background flex flex-col overflow-hidden`.
- Keep the sticky header, `main flex-1 min-h-0`, and existing mobile/desktop branches unchanged.

That makes the flex column exactly viewport-tall; `main` gets the leftover space; the `Conversation`'s internal scroll area handles overflow; the composer stays pinned at the bottom of the visible area — above the keyboard on iOS (which is already set to `Native` resize via `useIosKeyboard`).

No other files change. No native/Capacitor changes. No changes to Textarea used elsewhere, so no risk of regressions on other forms.

## Verification

- iOS native (TestFlight build required to see the fix live, since it's frontend code shipped in the WebView bundle): open a chat, tap the input — no zoom, composer stays visible above the keyboard, typed text is visible.
- Web preview: chat still renders correctly on desktop and mobile viewport; no visual change to other pages.

## Not in scope

- No changes to notifications, chat backend, RLS, or edge functions.
- No changes to `Textarea` globally, to `index.html` viewport meta, or to other pages.
- No changelog / Help update — this is a small bugfix, not a user-facing feature (matches the project rule "Help.tsx behøver ikke ændres for denne lille rettelse").
