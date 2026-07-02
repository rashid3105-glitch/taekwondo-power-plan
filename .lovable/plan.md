# 5 Google Play Feature Graphics (1024×500)

Deliver 5 marketing banners to `/mnt/documents/` — dark cockpit theme matching the app, English copy, each with a phone-mockup showing a real screenshot from the corresponding module.

## The 5 graphics

| # | Headline | Sub | App screen captured |
|---|----------|-----|---------------------|
| 1 | PERFORM | Sport science built for Taekwondo | `/dashboard` (hub tab) |
| 2 | RECOVER | Smarter rest. Fewer injuries. | `/dashboard` → rehab tab |
| 3 | TRACK | Every rep, every match, one place | `/dashboard` → progress tab (FormCurve) |
| 4 | FOCUS | Mental performance, measured | `/dashboard` → mental tab |
| 5 | GROW | From talent to podium | `/dashboard` → plan tab |

## Layout (per graphic)

```
1024 × 500 canvas, background #0a0a0a with subtle red radial glow
┌────────────────────────────────────────────────────┐
│  SPORTSTALENT logo (top-left, small)               │
│                                                    │
│  BIG HEADLINE (left, ~72px black)      [ phone   ] │
│  Subhead (left, ~22px muted)           [ mockup  ] │
│                                        [ w/ real ] │
│  ▸ tiny red accent bar                 [ screen  ] │
└────────────────────────────────────────────────────┘
```

- Phone mockup: rounded-corner dark frame (iPhone-style), the app screenshot fills it, slight tilt + drop shadow.
- Left column: SPORTSTALENT wordmark, headline in white with red accent letter, one-line subhead in muted gray.
- Red accent: `hsl(0, 80%, 55%)` — matches app's `--explosive` token.

## How I'll build it

1. Restore the authenticated Supabase session (`LOVABLE_BROWSER_*`) and use Playwright to open the 5 dashboard tabs at 390×844 viewport, saving PNG screenshots to `/tmp/browser/shots/`.
2. Python + PIL script (`/tmp/make_feature_graphics.py`):
   - Load the SPORTSTALENT logo from `user-uploads://` (same source used for the splash).
   - For each of the 5 entries: compose 1024×500 canvas → paint dark bg + radial red glow → paste rounded phone frame with screenshot on right → draw logo + headline + subhead on left.
   - Fonts: use a bundled system sans (DejaVu Sans Bold for headlines, regular for subhead) — Google Play accepts any legible type; no need to add project fonts.
3. Save as `/mnt/documents/feature-graphic-1-perform.png` … `feature-graphic-5-grow.png`.
4. QA: view each PNG, check dimensions = 1024×500, file size < 15 MB, no clipped text, screenshot legible.
5. Emit 5 `<presentation-artifact>` tags so you can download them directly.

## Notes

- No project code changes — this is a pure artifact generation task.
- If a dashboard tab won't render (auth injection failed), I'll fall back to a stylized abstract "screen" mock in the phone frame so all 5 still ship.
