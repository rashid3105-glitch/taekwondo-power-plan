## Goal

Improve the Match Analyse layout so the coach can watch the clip and tag at the same time, with a fixed video height and no playback interruption when adding a tag or pressing play/pause.

## Changes (frontend only, in `src/components/match/VideoTagger.tsx`)

### 1. Fixed 400px video height + side-by-side layout

Wrap the video player and the "Add tag" panel in a 2-column grid on `lg:` and stack on smaller screens.

```text
lg ≥ 1024px                          mobile / tablet
┌────────────────┬───────────────┐   ┌────────────────┐
│  Video (400px) │  Add tag      │   │  Video (400px) │
│                │  - technique  │   ├────────────────┤
│                │  - side       │   │  Add tag       │
│                │  - outcome    │   ├────────────────┤
│                │  - note       │   │  Tag list      │
│                │  [+ Tag]      │   └────────────────┘
├────────────────┴───────────────┤
│  Tag list (full width)         │
└────────────────────────────────┘
```

- `<video>` element: replace `w-full` with `className="w-full h-[400px] object-contain rounded-lg border border-border bg-black"` so the height is locked at 400 px and the frame letterboxes instead of stretching.
- Tag panel becomes a sibling column with `max-h-[400px] overflow-auto` so it matches the video height visually.
- Tag list stays below the grid (full width) since it can be long.

### 2. Don't reload the player when adding/deleting a tag

Today, `addTag()` and `deleteTag()` call `await load()`, which re-resolves the signed URL, sets `videoSrc` again and re-mounts the `<video>` element. Result: playback stops, position jumps to 0, focus moves to the page.

Fix:
- Append the inserted tag to local `tags` state (using the row returned by `.insert(...).select().single()` for online, or the pending object for offline) instead of calling `load()`.
- For delete: filter the tag out of local `tags` state.
- Keep `onChanged?.()` so the parent's pending counter still updates.
- Only call full `load()` when `video.id`, `isOffline`, or `isCached` changes (already in the existing `useEffect`).

### 3. Keep focus on the video on play/pause

- The "Tag at current time" button is inside a `<form>`-less div but still triggers a parent re-render due to `setAdding`/`load()`. Once #2 is in place, no remount happens.
- Also add `type="button"` to the add-tag and delete buttons (defensive — prevents any implicit form submit) and `onMouseDown={(e) => e.preventDefault()}` on the delete `<Trash2>` so it doesn't steal focus from the video while hovering tag rows.
- The `<video controls>` itself keeps native play/pause; no React state is touched on play, so focus stays on the video element.

## Out of scope

- No changes to data model, RPCs, or offline sync.
- No changes to `MatchShare.tsx` (public viewer).
- Tag list height and styling unchanged apart from the grid wrapping.
