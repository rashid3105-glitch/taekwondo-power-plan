# Club branding — background color

Add a third club color: the app background. Text, borders and muted colors are derived automatically so everything stays readable on both light and dark club backgrounds.

## Admin (club admin page)

The Branding section gets a third swatch next to Primary and Accent:

```text
Primary color      Accent color       Background color
[■] #D4AF37        [■] #1A1A1A        [■] #0F1115
```

- Same picker + hex field behaviour as the existing two.
- The live preview uses the chosen background instead of the fixed cockpit color, so the admin sees exactly how logo, buttons and text will look.
- Contrast checks now run against the chosen background (not the fixed one). A warning appears if primary or accent falls below readable contrast on it.
- "Reset to default" also restores the standard dark background.

## Readability handling

From the background hex the theme derives:
- foreground / card-foreground: near-white on dark backgrounds, near-black on light ones (luminance threshold).
- muted, muted-foreground, border, card and popover surfaces: shifted a few steps lighter or darker than the background so panels stay distinguishable either way.
- primary/accent foregrounds keep the existing readable-foreground logic.
- Lightness of the background is clamped so extreme values can't produce an unusable UI.

Members of the club see the background applied across the authenticated app; public pages and emails stay Sportstalent-branded.

## Technical notes

- `public.clubs` gains `background_color text` (nullable).
- `src/lib/clubTheme.ts`: extend `buildClubTheme` to accept a background hex and emit `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `muted`, `muted-foreground`, `border`, `input` token values; add a `deriveSurfaces(bgHex)` helper and change contrast checks to take the background as a parameter (default stays `COCKPIT_BG`).
- `src/components/ClubThemeProvider.tsx`: select `background_color`, extend the `VARS` map with the new tokens, and clear them all on sign-out / branding-off.
- `src/components/admin/ClubBrandingSection.tsx`: third color field, save `background_color`, preview and contrast against it.
- New translation keys (`brandingBackground`, background hint/warning) in all 7 languages.
- Changelog entry in `src/pages/Help.tsx` (v1.5.25).
