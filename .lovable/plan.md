# Fix iPhone tap-feedback sync (instant press response)

## Problem
On iPhone, when you tap a button or menu item, the visual "press" flash arrives *after* the finger lift, or stays stuck on after release. It feels out of sync with the touch.

Root causes in the current code:

1. **No `:active` state on buttons/links.** `src/components/ui/button.tsx` only defines `hover:` colours. On iOS, `:hover` is *simulated* — it triggers on tap and stays sticky until you tap elsewhere. Result: the highlight either lags, persists after release, or never appears at the right moment.
2. **Native tap highlight is globally disabled** (`-webkit-tap-highlight-color: transparent` in `src/index.css`). That's intentional for a "native feel" — but with no replacement `:active` style, there is *no* press feedback at all on many elements (cards, list rows, dropdown items).
3. **`transition-colors` adds a 150ms ease.** Combined with the sticky `:hover`, the down→up cycle visibly trails the finger.
4. Some interactive surfaces (dashboard tiles, list rows, `[role="button"]` divs) have no press state at all.

## Goal
Press feedback must appear **the instant the finger touches** the element and disappear **the instant the finger lifts** — across buttons, links, menu items, tabs, cards, and any tappable row.

## Approach

### 1. Add `:active` styles to the shared `Button` (`src/components/ui/button.tsx`)
Extend each variant with an `active:` colour (slightly darker than hover) and add `active:scale-[0.98]` for a subtle, snappy press. Shorten the colour transition to ~75 ms so the press registers immediately.

```text
default:     active:bg-primary/80
destructive: active:bg-destructive/80
outline:     active:bg-accent/80
secondary:   active:bg-secondary/70
ghost:       active:bg-accent/80
link:        active:opacity-70
```

Also change base classes:
- `transition-colors` → `transition-[background-color,transform,opacity] duration-75`
- add `active:scale-[0.98]` (skipped for `link` variant)
- add `touch-action: manipulation` already exists globally — fine.

### 2. Global press feedback for non-button tappables (`src/index.css`)
Add a small utility layer so any element with `[role="button"]`, `<a>`, or our shared `.tappable` class gets the same instant feedback:

```text
@media (hover: none) {
  button:active,
  a:active,
  [role="button"]:active,
  .tappable:active {
    opacity: 0.85;
    transition: opacity 50ms linear;
  }
}
```

The `(hover: none)` query scopes it to touch devices so desktop hover behaviour is unaffected.

### 3. Kill sticky `:hover` on touch devices
Wrap the existing `hover:` colour rules with `@media (hover: hover)` semantics by adding a top-level CSS reset:

```text
@media (hover: none) {
  /* Disable hover styles on touch — they create the "stuck highlight" effect */
  *:hover { transition: none; }
}
```

(This is a targeted reset — Tailwind's `hover:` utilities still apply on real hover devices.)

### 4. Apply `.tappable` to known interactive surfaces
Audit the obvious candidates and add the class (or a `:active` style) so list rows/cards also feel responsive:
- `src/components/RecoveryTile.tsx`
- `src/components/DayCard.tsx`
- `src/components/AIPlanCard.tsx`
- `src/pages/Dashboard.tsx` quick-action grid tiles
- `src/components/ui/tabs.tsx` triggers (add `active:bg-accent/80`)
- `src/components/ui/dropdown-menu.tsx` items (add `active:bg-accent/80`)
- `src/components/ui/select.tsx` items (add `active:bg-accent/80`)

For the shadcn primitives (`tabs`, `dropdown-menu`, `select`, `command`), extend their item classNames with the `active:` rule — single-line edits.

### 5. Optional haptic alignment
`src/lib/haptics.ts` already exists. Where we already call `haptics.tap()` on click, move the call from `onClick` to `onPointerDown` so the buzz fires with the visual press, not after release. Scope: only the primary nav (dashboard tabs, bottom nav) — not every button, to avoid over-buzzing.

## Out of scope
- Changing colours or the overall design language.
- Adding ripple animations (would need a JS layer; not worth the bundle cost).
- Refactoring component APIs.

## Verification
1. Open preview on iPhone via the Capacitor build.
2. Tap nav items, dashboard tiles, dialog buttons, dropdown menu items, tab triggers — each must darken/scale **immediately on touch** and revert **immediately on lift**.
3. No element should remain visually "pressed" after the finger leaves.
4. Desktop hover behaviour must remain identical (Tailwind `hover:` still wins on `(hover: hover)` devices).

## Files touched
- `src/components/ui/button.tsx`
- `src/index.css`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/command.tsx`
- A handful of tile/card components listed above
