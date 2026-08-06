# Club branding — add-on module

Goal: an optional "Club branding" add-on that admins switch on per club in the module page. When active, an admin can upload the club logo and pick two theme colors on the club admin page, and those colors and logo are applied across the athlete/coach app for members of that club.

## 1. Activation (module page)

`/admin/modules` gets a new optional module `branding` ("Club branding — logo & colors") alongside Progress, Mental, Nutrition, etc. It follows the existing club-default + athlete-override pattern, but is evaluated at club level: when off, the branding editor is hidden on the club admin page and members see the standard Sportstalent theme.

## 2. Editor (club admin page)

Inside each club card on `/admin/clubs`, a collapsible "Branding" section, only shown when the add-on is on for that club.

```text
┌─ Seoul Taekwondo Klub ──────────── Max athletes [ 25 ] ┐
│  Share coach notes                              [ ● ]  │
│  License active                                 [ ● ]  │
│ ────────────────────────────────────────────────────── │
│  ▾ Branding                              add-on: ON    │
│                                                        │
│   Logo                                                 │
│   ┌────────┐                                           │
│   │  LOGO  │   [ Upload logo ]  [ Remove ]             │
│   │  96x96 │   PNG/SVG, max 2 MB, square works best    │
│   └────────┘                                           │
│                                                        │
│   Primary color        Accent color                    │
│   [■] #D4AF37          [■] #1A1A1A                     │
│    ^ swatch opens color picker + hex field             │
│                                                        │
│   Preview                                              │
│   ┌──────────────────────────────────────────────┐     │
│   │ [logo]  Seoul Taekwondo Klub                 │     │
│   │  ▬▬▬▬▬▬▬▬▬▬  primary bar                     │     │
│   │  [ Primary button ]   [ Outline button ]     │     │
│   │  contrast check: AA pass                     │     │
│   └──────────────────────────────────────────────┘     │
│                                                        │
│                          [ Reset to default ] [ Save ] │
└────────────────────────────────────────────────────────┘
```

- Swatch opens a color picker with an editable hex field; the mini preview updates live.
- Contrast is checked against the dark cockpit background; a warning appears if text on the color would be unreadable.
- "Reset to default" clears back to Sportstalent gold/noir.
- Logo cropping reuses the existing crop dialog from the landing hero images.

## 3. Applying the theme in the app

A `ClubThemeProvider` loads the signed-in user's club branding once after login and, when the add-on is active for that club, sets the CSS variables that already drive the design system (`--primary`, `--accent`, and their foreground/glow variants) on the app root. Because every component uses semantic tokens, buttons, rings, charts, and highlights pick up the club color automatically — no per-component changes.

Logo: the in-app header logo (dashboard, coach view) shows the club logo when set, falling back to the Sportstalent mark. Public pages, marketing pages, and emails stay Sportstalent-branded.

Colors are converted to the HSL triplet format the tokens expect, and clamped for lightness so an extreme color can't make the dark UI unreadable.

## Technical notes

- `public.clubs` gains `logo_url text`, `primary_color text`, `accent_color text` (nullable). Existing admin-update and member-select policies already cover writes and reads.
- Module flag stored with the existing `club_module_defaults` mechanism under key `branding`.
- New public storage bucket `club-logos`, path `{club_id}/logo.{ext}`; admin-only writes via `storage.objects` policies, public read.
- Hex validated client-side (`#RRGGBB`) and again before write; only hex is accepted, never raw CSS, so no injection into style values.
- New files: `src/components/admin/ClubBrandingSection.tsx`, `src/components/ClubThemeProvider.tsx`, `src/lib/clubTheme.ts` (hex→HSL, contrast + clamping). Edits: `src/pages/AdminClubs.tsx`, `src/pages/AdminModuleAccess.tsx`, `src/App.tsx` (provider), `src/components/BrandLogo.tsx` (club logo fallback).
- New translation keys in all 7 languages for the branding section, module label, and validation messages.
- Changelog entry in `src/pages/Help.tsx`.
- Not included: per-club fonts, per-club landing pages, club-branded emails.
