## Goal
Restore vertical scrolling on all pages in Chrome (desktop and iPhone) without changing app content, backend, or navigation.

## Plan
1. **Reproduce and isolate the Chrome-specific blocker**
   - Verify the issue on desktop and mobile-sized Chrome preview sessions.
   - Check whether the page itself stops scrolling or whether an invisible/fixed layer is intercepting input.

2. **Audit global input and overlay layers**
   - Inspect the remaining global suspects that can block scrolling across every route:
     - splash overlay lifecycle
     - floating AI assistant drag/capture behavior
     - app-level animated route wrapper
     - global `touch-action` / overscroll CSS rules
   - Prioritize anything fixed-positioned or attached at app root level.

3. **Apply the smallest Chrome-safe fix**
   - Remove or narrow any root-level gesture handling that steals touch/wheel input in Chrome.
   - If needed, make fixed overlays non-interactive unless visibly active, and ensure drag behavior only activates on deliberate drag after threshold.
   - Keep Safari behavior unchanged.

4. **Validate across routes and viewport sizes**
   - Re-test landing, coach, dashboard/help-type routes, on desktop and iPhone viewport.
   - Confirm normal vertical scroll, including when the first gesture starts near floating UI.

## Technical details
- Files most likely involved:
  - `src/components/AIAssistant.tsx`
  - `src/App.tsx`
  - `src/components/SplashScreen.tsx`
  - `src/index.css`
- Current evidence suggests this is a **global interaction-layer issue**, not a page-specific layout issue.
- I will avoid changing page content, translations, database, or business logic.