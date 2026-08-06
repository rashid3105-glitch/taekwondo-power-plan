# Club branding in Admin — mockup first

Goal: let a platform admin upload a club logo and pick two theme colors per club, from the existing club admin page. This step delivers the UI mockup and the data model; applying the theme across the athlete/coach app is a separate later step.

## Where it lives

Inside the existing club cards on `/admin/clubs`. Each club card gets a new collapsible "Branding" section, so nothing else on the page moves.

## Mockup

```text
┌─ Seoul Taekwondo Klub ──────────── Max athletes [ 25 ] ┐
│                                                        │
│  Share coach notes                              [ ● ]  │
│  License active                                 [ ● ]  │
│ ────────────────────────────────────────────────────── │
│  ▾ Branding                                            │
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
│   └──────────────────────────────────────────────┘     │
│                                                        │
│                          [ Reset to default ] [ Save ] │
└────────────────────────────────────────────────────────┘
```

Behavior:
- Clicking a swatch opens a small color picker with an editable hex field.
- The mini preview updates live as colors change, so the admin sees the result before saving.
- "Reset to default" clears the colors back to the Sportstalent gold/noir defaults.
- Save is disabled until something changed, matching the current card behaviour.
- Logo upload crops/centers using the existing `ImageCropDialog` already used for hero images.

## Technical notes

- New columns on `public.clubs`: `logo_url text`, `primary_color text`, `accent_color text` (all nullable). Existing admin-only update policy already covers writes; the existing member/coach select policy lets the app read the branding later.
- New public storage bucket `club-logos`, path `{club_id}/logo.{ext}`; upload allowed for admins, public read.
- Hex values validated client-side (`#RRGGBB`) before save.
- New component `src/components/admin/ClubBrandingSection.tsx`, rendered inside the club card in `src/pages/AdminClubs.tsx`. No other pages change.
- New translation keys for all 7 languages (branding, logo, upload logo, remove, primary color, accent color, preview, reset to default, invalid color, file too large).
- Not in this step: applying club colors to the live app theme, per-club fonts, or a per-club landing page.
