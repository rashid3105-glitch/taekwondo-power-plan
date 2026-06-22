# Forberedelse i Lovable før du går lokalt (iOS først)

Baseret på dine svar laver jeg disse 3 ting i build-mode. Alt sker i koden — du behøver ikke gøre noget under dette trin. Bagefter følger du RUNBOOK.md lokalt.

## 1. SPORTS TALENT app-ikon (1024×1024)
- Genererer et premium-kvalitets PNG-ikon i SPORTS TALENT-stil: mørk baggrund, rød accent, "ST"-monogram eller stiliseret mark (matcher jeres branding-memory)
- Gemmer til `resources/icon.png` så `npx @capacitor/assets generate` kan bruge det direkte
- Genererer også `resources/splash.png` (2732×2732, samme stil) til splash screen

## 2. RUNBOOK.md
Lægger en komplet tjekliste i repo-roden med ALLE trin fra førstegangs-guiden, så du har den lokalt når du arbejder i Terminal/Xcode. Indhold:
- Del A: Konti & udstyr (Apple Developer, Play Console, Xcode, Android Studio)
- Del B: Klon repo + npm install
- Del C: `npm run build`, `npx cap add ios/android`, `npx cap sync`, ikon-generering
- Del D: iOS Xcode-trin (signing, Info.plist permissions, Archive, TestFlight)
- Del E: Android Studio-trin (keystore, AAB, Play Internal Testing) — du gør denne EFTER iOS er live
- Del F: Supabase redirect URL-tilføjelse
- Del G: Smoke-test-checkliste
- "Når der kommer ny version"-sektion til fremtidige opdateringer

## 3. Auth storage → Capacitor Preferences (kun i native runtime)
**Sikkert for aktive brugere — her er hvorfor:**
- Ændringen er en wrapper der KUN aktiverer sig når `Capacitor.isNativePlatform()` er true
- Web-brugere (alle nuværende brugere på sportstalent.dk og PWA) bruger fortsat localStorage — uændret adfærd, ingen logout
- Native-brugere findes endnu ikke (appen er ikke udgivet), så der er ingen migrations-problem
- Når en eksisterende web-bruger senere installerer den native app, logger de ind én gang i app'en — det er normalt for førstegangs app-install

**Konkret implementation:**
- Ny fil `src/lib/nativeAuthStorage.ts`: implementerer `Storage`-interface med `@capacitor/preferences` backend
- Opdaterer Supabase client-initialisering så `auth.storage` peger på native-storage i Capacitor, ellers default localStorage
- **Vigtigt:** `src/integrations/supabase/client.ts` er auto-genereret og må ikke ændres. Løses ved at lave en lille wrapper-init i `src/lib/nativeInit.ts` der erstatter auth-storage på client efter mount (Supabase supporter dette via `supabase.auth.initialize` mønstre — alternativt en custom client side-by-side kun til native)
- Hvis den auto-genererede client gør wrapper umulig, dokumenterer jeg blokkeren i RUNBOOK og lader localStorage stå — den fungerer fint i WebView, bare med risiko for sjælden cache-clear logout. Ikke kritisk for fase 1.

## Rækkefølge (iOS først)
1. Jeg laver de 3 ovenstående ændringer
2. Du afventer Apple Developer-godkendelse (1-48t)
3. Du følger RUNBOOK.md Del A → B → C → D (iOS) → F → G (kun iOS-test)
4. Når iOS er i TestFlight: gå tilbage til RUNBOOK Del E for Android

## Hvad jeg IKKE rører
- Ingen backend-ændringer
- Ingen ændringer til eksisterende web-flows
- Ingen ændringer til andre brugeres login-tilstand
- `src/integrations/supabase/client.ts` (auto-genereret)

## Filer der ændres/oprettes
- `resources/icon.png` (ny, genereret)
- `resources/splash.png` (ny, genereret)
- `RUNBOOK.md` (ny)
- `src/lib/nativeAuthStorage.ts` (ny)
- `src/lib/nativeInit.ts` (lille opdatering hvis auth-storage swap er muligt)
- `.lovable/plan.md` (opdateres med fase 1 status)

Klar til at gå i build-mode og udføre dette?