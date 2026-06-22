# Native mobile app — Capacitor

To-delt plan: **Fase 1** er en konkret 2-dages MVP der får appen i TestFlight + Google Play Internal Testing. **Overblikket** er hele vejen til fuld native paritet i veldefinerede faser.

Backend (Lovable Cloud / Supabase) røres ikke i fase 1. Push, HealthKit og IAP kommer i senere faser og kræver små backend-tilføjelser (ikke -ændringer).

---

## FASE 1 — MVP TestFlight (2 dage)

Mål: jeres nuværende app kører som rigtig native app på iPhone og Android via TestFlight + Play Internal Testing, signeret med rigtige certifikater, login virker, alle skærme virker. Ingen native features endnu (web-push, web-camera fungerer i WebView).

### Forudsætninger (du skaffer selv, før vi starter)

- Apple Developer Program — $99/år, [https://developer.apple.com/programs/](https://developer.apple.com/programs/) (op til 48t godkendelse)
- Google Play Console — $25 engangs, [https://play.google.com/console/signup](https://play.google.com/console/signup)
- Mac med Xcode 15+ installeret (kun til iOS-build; Android kan bygges fra hvad som helst)
- Android Studio installeret

### Dag 1 — Capacitor + iOS

**1. Capacitor-setup i projektet (~30 min)**

- Install: `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/preferences`, `@capacitor/haptics`
- `capacitor.config.ts` findes allerede — verificér `appId: app.lovable.a65f5c861a844640b1394767189347ea`, `appName: taekwondo-power-plan`
- **Vigtigt:** fjern `server.url` blokken (hot-reload mod sandbox) før produktionsbuild — ellers loader app'en fra Lovable preview og afvises af App Store
- Tilføj `webDir: "dist"` og `bundledWebRuntime: false`

**2. Frontend-tilpasninger (~1 time)**

- Skift Supabase auth storage fra `localStorage` til `@capacitor/preferences` via wrapper (kun i Capacitor-runtime — web bruger stadig localStorage)
- Tilføj `<StatusBar>` config i `main.tsx`: dark mode, overlay false
- Verificér safe-area: `pt-safe`/`pb-safe` er allerede i brug
- Tilføj `App.addListener("backButton")` for Android tilbageknap-håndtering
- Disable PWA service worker i Capacitor-runtime (check `Capacitor.isNativePlatform()` i `sw.js`-registrering)

**3. Ikoner + splash (~30 min)**

- 1024×1024 master ikon (kan genereres med imagegen hvis I ikke har)
- `npx @capacitor/assets generate` → genererer alle størrelser til både platforme

**4. iOS-projekt (~2-3 timer)**

- `npm run build && npx cap add ios && npx cap sync ios`
- Åbn `ios/App/App.xcworkspace` i Xcode
- Konfigurér Bundle ID, signing team, version 1.0.0, build 1
- Info.plist: app display name "Sports Talent", NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSMicrophoneUsageDescription (til match-video)
- Update Site URL i Supabase Auth: tilføj custom URL scheme `app.lovable.a65f5c861a844640b1394767189347ea://` til Redirect URLs
- Build → Archive → Upload til App Store Connect
- TestFlight: tilføj internal testers (op til 100, ingen review)

### Dag 2 — Android + polish

**5. Android-projekt (~2 timer)**

- `npx cap add android && npx cap sync android`
- Åbn `android/` i Android Studio
- Konfigurér applicationId, version, signing config (generér keystore — opbevar sikkert!)
- AndroidManifest.xml: permissions for kamera, internet, vibrate
- Build → Generate Signed Bundle (AAB) → upload til Play Console
- Internal Testing-spor: tilføj testers via email (ingen review for internal track)

**6. Smoke-test på begge platforme (~2 timer)**

- Login (email + Google — Google åbner ekstern Safari for nu, OK i fase 1)
- Naviger alle 5 bottom-nav-tabs
- Opret en diary entry offline → reconnect → sync
- Åbn kalender, opret begivenhed
- Coach-mode: åbn en atlets profil
- Sprog-switch (DA/EN/AR for RTL-test)
- Tag billede via match-video upload

**7. Kendte begrænsninger i fase 1 (dokumentér til testere)**

- Push notifications: kun via web (virker ikke når app er lukket)
- Google login åbner ekstern browser
- Ingen HealthKit/Health Connect
- Stripe-abonnement åbner ekstern browser

### Leverancer efter dag 2

- TestFlight-link til iOS-testere
- Play Internal Testing-link til Android-testere
- `ios/` og `android/` mapper committet i repo
- Kort runbook: hvordan I bygger ny version (`npm run build && npx cap sync && open Xcode/Android Studio`)

### Risici fase 1

- Apple Developer-godkendelse forsinket → kan ikke bygge til iOS device; brug simulator først
- Bundle ID-konflikt hvis nogen har taget jeres → check først på App Store Connect
- Supabase Google OAuth-redirect skal opdateres → kan kortvarigt knække web-login hvis fejlkonfigureret

---

## OVERBLIK — alle faser (uden tidsangivelser i kalenderdage)

### Fase 1: MVP TestFlight ✅ (ovenfor)

App kører signeret på begge platforme. Klar til intern test.

### Fase 2: Store-klar v1.0

- Apple Sign-In (krævet af App Store når Google er aktiveret) — Lovable Cloud managed Apple-provider
- Universal Links + App Links (deep linking til `/competition-reflection/:id` osv.) — DNS-filer på `sportstalent.dk`
- App Store screenshots i 6 størrelser, beskrivelser på alle 7 sprog
- Privacy nutrition labels (Apple) + Data Safety form (Google) — I har allerede PrivacyPolicy.tsx
- Public review-indsendelse → 3-7 dages ventetid, ofte rejects første gang

### Fase 3: Native push (det største UX-løft)

- APNs key (.p8) fra Apple Developer
- Firebase-projekt + `google-services.json` til FCM
- `@capacitor/push-notifications` plugin
- **Backend-tilføjelse**: udvid `push_subscriptions` med `platform` + `device_token`, eller ny `device_tokens`-tabel
- Opdater `send-push` edge function: route web-push for browsers, APNs for iOS, FCM for Android
- Behold web-push for desktop/PWA-brugere

### Fase 4: Native Google sign-in

- `@codetrix-studio/capacitor-google-auth` plugin (native sheet i stedet for ekstern browser)
- iOS bundle ID + Android SHA-1 fingerprint i Google Cloud Console OAuth client
- Konfigurér samme Supabase Google-provider

### Fase 5: HealthKit (iOS)

- Plugin: `@perfood/capacitor-healthkit`
- Permissions i Info.plist: `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`
- Læs steps, sleep, restingHR, HRV, workouts → send via eksisterende `health-sync-simple` edge function til eksisterende `health_data`-tabel (triggeren `mirror_health_data_to_summary` håndterer resten)
- Optional: `BGTaskScheduler` for ægte baggrunds-sync (Swift-arbejde)

### Fase 6: Health Connect (Android)

- Plugin: `capacitor-health-connect`
- Permissions per data-type i AndroidManifest.xml
- Map til samme `health_data`-skema som iOS
- Kræver Android 14+; ældre devices får manuel-only

### Fase 7: Native video capture

- `@capacitor/camera` til foto
- `capacitor-video-recorder` eller `@capacitor-community/camera-preview` til match-video
- Chunked upload til Supabase Storage (allerede implementeret via `matchSyncEngine`)
- Accept at upload pauses ved baggrund — ægte background upload kræver Swift `URLSession`

### Fase 8: In-app purchases (KUN hvis I sælger abonnement i appen)

- Stor ekstra indsats — Apple/Google kræver IAP for digital indhold, 15-30% commission
- `@capacitor-community/in-app-purchases` + StoreKit/Play Billing
- Backend: nye edge functions til at validere App Store / Play receipts → sync til `subscriptions`-tabel
- **Anbefaling**: behold Stripe-flow i web, link til web fra app (gråt område for fitness — søg juridisk afklaring)

### Fase 9: CI/CD (anbefalet, ikke krævet)

- GitHub Actions + Fastlane → auto-build til TestFlight / Play Internal Testing ved hver tag
- Alternativ: manuel build i Xcode/Android Studio efter `git pull`

### Hvad jeg ikke gør uden eksplicit go-ahead

- Ingen ændringer i `src/integrations/supabase/client.ts` (auto-genereret)
- Ingen backend-migreringer i fase 1
- Ingen Stripe-omlægning til IAP

---

## Hvad jeg har brug for fra dig for at starte fase 1

1. **Bekræft**: skal jeg gå i gang med fase 1 nu? (Kræver at jeg switcher til build mode efter dit ja)
2. **Apple Developer-konto**: er den oprettet, eller starter du den i dag? (Påvirker om dag 1 bliver iOS eller Android først)
3. **App-navn på store**: "SportsTalentDK" eller andet? (Skal være unikt globalt på App Store)
4. **Ikon**: har I et 1024×1024 master-ikon, eller skal jeg generere et i SPORTS TALENT-stil?