## Status: Native chat bug resolved on build 16 ✅

Tapping a conversation now works in TestFlight (iOS build 16) — no white screen, no error boundary triggered. That means the fix from the previous turn did the job:

- `thread.members` defensive guard in `Conversation.tsx` (the most likely root cause)
- Null-safe accessors in `MessageBubble.tsx`
- `<ErrorBoundary>` around `<Conversation>` in `Messages.tsx` (safety net — never had to render)

## Proposed cleanup plan

Now that native is stable, I'd like to tidy up the diagnostic + defensive scaffolding we added while hunting the bug, so it doesn't stay in production forever. Nothing here changes user-visible behavior.

### 1. Keep (permanent)
- ✅ `ErrorBoundary` component + wrapping around `<Conversation>` — cheap insurance, keep forever.
- ✅ `thread.members` defensive guard (`Array.isArray(...) ? ... : []`) — correct defensive coding, keep.
- ✅ Null-safe accessors in `MessageBubble.tsx` — keep.
- ✅ `BodyPointerEventsGuard` — keep, it protects against the earlier Radix scroll-lock issue.

### 2. Remove (diagnostic-only, no longer needed)
- `console.info("[chat] open thread", …)` diagnostic log in `src/pages/Messages.tsx` (`openThread`). Was only added to trace the "everything dead" state; native is confirmed working.
- The `document.body.style.pointerEvents` inline clears inside `openThread` / `closeThread` — `BodyPointerEventsGuard` already handles this globally, so the inline clears are redundant.

### 3. Changelog
- Add a v1.3.3 "Native chat stability confirmed" line in `src/pages/Help.tsx` (all 7 languages) noting the fix shipped in build 16.

### Files touched
- `src/pages/Messages.tsx` — remove diagnostic `console.info` + redundant pointer-events clears in `openThread`/`closeThread`.
- `src/pages/Help.tsx` — add v1.3.3 changelog entry.
- `src/i18n/translations.ts` — add `changelog_v133` / `changelogEntry169` keys in all 7 languages.

Want me to proceed with this cleanup, or leave the diagnostics in for one more build cycle just in case?
