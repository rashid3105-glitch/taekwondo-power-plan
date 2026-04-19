

The user wants to replace the app logo with the uploaded `IMG_3338.png` (the red "SPORTSTALENT.DK" running figure logo).

## Current logo usage

The existing logo lives at `src/assets/logo.webp` and is imported in many places (PublicNav, SplashScreen, Dashboard, Auth, etc.). PWA icons live in `public/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`).

## Plan

1. **Copy the uploaded image** into the project as `src/assets/logo.png` (PNG preserves the transparent white background better than re-encoding to webp; the existing `logo.webp` will be left in place but no longer referenced).
2. **Update all imports** from `@/assets/logo.webp` → `@/assets/logo.png`. Files affected (based on grep of the codebase): `PublicNav.tsx`, `SplashScreen.tsx`, `Dashboard.tsx`, `Auth.tsx`, plus any other component currently importing `logo.webp`. I'll do a full search to catch every reference.
3. **Replace PWA / favicon assets** in `public/` with versions of the new logo:
   - `public/icon-192.png` (192×192)
   - `public/icon-512.png` (512×512)
   - `public/icon-maskable-512.png` (512×512, with safe-zone padding since the new logo has lots of whitespace already — good for maskable)
   - `public/apple-touch-icon.png` (180×180)
   - `public/favicon.png` (or `.ico`) referenced in `index.html`
   These will be generated from the uploaded image using ImageMagick/sharp.
4. **Verify** by spot-checking the rendered logo in PublicNav and SplashScreen at the small sizes they appear at (32px, 80px) — the new logo has more detail than the old one, so I'll confirm it still reads clearly. If it looks muddy at tiny sizes, I'll crop tighter around the runner figure for the favicon/192 variants.

### Caveat
The new logo has a **light/white background** baked in, while the app uses a **dark theme** (`#0F172A`). The runner is dark red on white, which will create a white square on dark surfaces (nav bar, splash screen). Two options for how to handle this:

- **A) Use as-is** — white rounded square containing the logo on dark backgrounds (clean, brand-forward, matches the uploaded asset exactly).
- **B) Remove the white background** — make it transparent so just the red runner sits on the dark theme (more integrated, but the wordmark "SPORTSTALENT.DK" in red may have low contrast on the dark navy background).

I'll proceed with **option A** (use the image as uploaded, with the existing `rounded-lg` / `rounded-2xl` masking the white into a clean tile) since it preserves the brand exactly as the user uploaded it. If they want the transparent version, that's a one-line follow-up.

### Files modified
- `src/assets/logo.png` (new)
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`, `public/favicon.png` (replaced)
- All `.tsx` files that import `@/assets/logo.webp` (import path updated)
- `index.html` if favicon path needs adjustment

