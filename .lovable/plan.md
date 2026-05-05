## Problem

On iPhone, every time the coach adds a tag/note while analysing a match video, the video jumps back to the start. Two causes in `src/components/match/VideoTagger.tsx` + `src/pages/MatchAnalysis.tsx`:

1. **iOS plays the `<video>` in fullscreen by default** (no `playsInline`). Any DOM/state update around it kicks Safari out of the player and resets `currentTime` to 0.
2. After saving a tag, `onChanged` in `MatchAnalysis.tsx` calls `init()` which refetches the whole videos list. That replaces the `activeVideo` object reference and causes the `VideoTagger` `useEffect([video.id, isOffline, isCached])` to look stable — but the parent re-render plus offline-state changes can still trigger a re-load that regenerates `videoSrc` and resets the `<video>` element.

## Fix

**`src/components/match/VideoTagger.tsx`**
- Add iOS-friendly attributes to the `<video>`: `playsInline`, `webkit-playsinline`, `x-webkit-airplay="allow"`, `controlsList="nodownload"`, `disablePictureInPicture={false}`. This keeps playback inline so adding a tag no longer dismisses the player.
- Track `currentTime` in a ref via `onTimeUpdate` and `onPause`. If `videoSrc` ever changes while we already have a position (e.g. signed URL refresh after `load()`), restore `currentTime` on `onLoadedMetadata` and resume `play()` if it was playing before.
- Do **not** re-run `load()` after `addTag` / `deleteTag` (already the case) — but also memoise `videoSrc` so a parent rerender that doesn't change `video.id` cannot trigger a new signed URL fetch. Guard `load()` with an "already loaded for this id" check.
- Blur the note `<Input>` before calling `addTag` on iOS so Safari doesn't steal focus from the video element. Use `onMouseDown={e => e.preventDefault()}` on the Add Tag button (and timeline markers already do this) to keep the video element from losing focus.

**`src/pages/MatchAnalysis.tsx`**
- Replace the heavy `onChanged={() => { void init(); void offline.refresh(); }}` with a lightweight refresh that only updates the videos list metadata (no full re-init that re-derives `activeVideo` identity). Pass a stable callback via `useCallback` so `VideoTagger` props don't churn.

## Verification

- Reload preview on iPhone 16 Pro, open a video, play, pause, add a tag → video stays at the same timestamp.
- Repeat with the video still playing → tag is added without interrupting playback (or auto-resumes from the same spot).
- Desktop Chrome/Safari unchanged.

## Out of scope

No backend, schema, or business-logic changes.
