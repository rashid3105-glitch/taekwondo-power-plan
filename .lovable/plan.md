

## Plan: Full App-Friendly Polish (Option B)

Make Sportstalent feel like a native app via PWA installability + native-feel UX polish. PWA features only activate in the published site, not the editor preview.

### What I'll build

**1. Installable PWA**
- `vite-plugin-pwa` with `devOptions.enabled: false` and iframe/preview-host guard so it never runs in the Lovable editor
- `public/manifest.json` — name, theme color (`#0F172A`), icons (192, 512, maskable), `display: "standalone"`
- Generate PWA icons from existing logo (192px, 512px, maskable 512px)
- iOS meta tags in `index.html`: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color`
- Service worker with `navigateFallbackDenylist: [/^\/~oauth/, /^\/api/]` and skip-cache for Supabase calls

**2. Install page (`/install`)**
- Platform-aware instructions (iOS Safari → Share → Add to Home Screen; Android → install prompt via `beforeinstallprompt`)
- Translated to all 6 languages
- Linked from Help page

**3. Native-feel mobile UX**
- **Safe area insets**: bottom nav respects iPhone home indicator (`pb-[env(safe-area-inset-bottom)]`)
- **Disable overscroll bounce**: `overscroll-behavior: contain` on body
- **Prevent input zoom on iOS**: ensure inputs have `font-size: 16px` minimum
- **Tap polish**: `-webkit-tap-highlight-color: transparent`, `user-select: none` on buttons, `touch-action: manipulation`
- **Status bar color**: matches dark theme via `theme-color` meta
- **Splash/loading screen**: replace `if (checking) return null` blank screens with a proper splash (logo + spinner) in Dashboard, Auth, ProfileSetup

**4. Page transitions**
- Wrap routes in `AnimatePresence` (framer-motion already used) — subtle fade between pages
- Respects `prefers-reduced-motion`

**5. Offline resilience (light)**
- Service worker caches app shell (HTML, CSS, JS, fonts, logo)
- Network-first for Supabase calls (never serve stale auth/data)
- "You're offline" banner component shown when `navigator.onLine === false`

### Files

**New**
- `public/manifest.json`
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`
- `src/pages/Install.tsx`
- `src/components/SplashScreen.tsx`
- `src/components/OfflineBanner.tsx`

**Modified**
- `vite.config.ts` — add VitePWA plugin
- `index.html` — Apple meta tags, theme-color, manifest link
- `src/main.tsx` — SW registration guarded against iframe + preview hosts
- `src/index.css` — safe-area utilities, overscroll-behavior, tap-highlight, body bg
- `src/App.tsx` — add `/install` route, wrap Routes in AnimatePresence, add OfflineBanner
- `src/pages/Dashboard.tsx` — bottom nav `pb-[env(safe-area-inset-bottom)]`, replace blank loading with SplashScreen
- `src/pages/Auth.tsx`, `src/pages/ProfileSetup.tsx` — use SplashScreen during checks
- `src/i18n/translations.ts` — install page strings (6 languages)
- `src/pages/Help.tsx` — link to `/install`

### Important caveats I'll flag to you
- PWA install prompt only works on the **published** sportstalent.dk site — not in the Lovable preview iframe
- iOS doesn't support `beforeinstallprompt`; users must use Safari → Share → Add to Home Screen
- Push notifications are NOT included (would need Capacitor for reliable iOS support — separate decision)
- Page transitions kept subtle (200ms fade) to avoid feeling laggy

### After implementation
You'll need to click **Publish → Update** to push the PWA to sportstalent.dk, then test "Add to Home Screen" on a real phone.

