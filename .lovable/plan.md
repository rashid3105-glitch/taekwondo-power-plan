## Goal
Restore vertical scrolling on every page in Chrome (desktop + iPhone). The symptom is global ("all pages won't scroll at all"), so the cause must be in a globally-mounted element or in the global CSS — not in any single page component.

## Suspects (in priority order)

1. **AIAssistant floating draggable button** (`src/components/AIAssistant.tsx`)
   - The fixed wrapper sets `touchAction: "none"` and calls `setPointerCapture(e.pointerId)` on every `pointerdown`.
   - Although the wrapper is only ~56×56 px, `touch-action: none` + pointer capture inside a `position: fixed` near the bottom-right is a known cause of "page won't scroll" on iOS Safari and Chrome, especially when the user's first touch lands on or near the FAB.
   - The drag handler captures the pointer regardless of whether the user intends to drag or scroll — there is no scroll-vs-drag threshold *before* capture.

2. **`AnimatePresence` wrapping `AIAssistant`** (`src/App.tsx` line 194)
   - `AIAssistant` is rendered **inside** `<AnimatePresence mode="wait">` next to `<Routes>`. On every navigation, AnimatePresence treats it as part of the keyed transition, which can leave a stale wrapper in the tree and interfere with scroll on the new page.
   - It should live **outside** AnimatePresence (as a sibling of `AnimatedRoutes`).

3. **`<Page>` wrapper `minHeight: "100%"`** (`src/App.tsx` lines 110–114)
   - `motion.div` with `style={{ minHeight: "100%" }}` has no effect because its parent has no defined height. Harmless on its own, but combined with framer's exit animations it can briefly produce a 0-height layer. Not the main cause but worth correcting to `minHeight: "100dvh"` for consistency.

4. **`html, body { overscroll-behavior-y: contain }`** (`src/index.css` line 154)
   - Correct usage, not a blocker. Mentioned only so it isn't blamed.

## Investigation step (do first)
Open the running app in the browser tool, run a DevTools snippet that reports:
- `getComputedStyle(document.documentElement)` and `body` overflow/height/touch-action
- Any element with `position:fixed` covering `>50%` of the viewport, plus its `pointer-events` and `touch-action`
- `document.scrollingElement.scrollHeight` vs `clientHeight`

This confirms whether the blocker is CSS (overflow lock) or pointer/touch (event interception). The fix branches accordingly.

## Fix plan (after confirming)

### A. AIAssistant FAB hardening (`src/components/AIAssistant.tsx`)
- Remove `touchAction: "none"` from the outer wrapper; move `touch-action: none` to the inner `<button>` only.
- Defer `setPointerCapture` until the pointer has moved > 6 px (introduce a small drag threshold). Until then, allow the browser to handle the gesture as a scroll.
- On `pointercancel`, reset `dragging.current = false` so an aborted gesture doesn't keep capture.

### B. Move AIAssistant out of AnimatePresence (`src/App.tsx`)
- Render `{shouldShowAIAssistant(location.pathname) && <AIAssistant />}` as a sibling of `<AnimatedRoutes />` (in the `App` tree, after `<AnimatedRoutes />`), not inside the `AnimatePresence` block.

### C. `<Page>` height correction (`src/App.tsx`)
- Change `style={{ minHeight: "100%" }}` to `style={{ minHeight: "100dvh" }}`.

### D. Verify
- Use browser tool at 390×844 (iPhone) and 1280×800 (desktop), navigate to `/coach/season-calendar`, `/dashboard`, `/help`, `/coach`, and confirm the page scrolls via wheel and via touch drag (including a touch that starts on top of the FAB).
- Confirm the FAB still drags after the threshold and still opens the chat on tap.

## Out of scope
- No backend, RLS, edge function, translation, or page-content changes.
- No new dependencies.

## Files expected to change
- `src/components/AIAssistant.tsx`
- `src/App.tsx`

If the DevTools investigation reveals a different global blocker (e.g. a leftover modal overlay or a `body { overflow:hidden }` toggled by some component), I will report the actual culprit and adjust the fix to target it instead of blindly applying A–C.
