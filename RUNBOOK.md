# SPORTS TALENT — TestFlight & Play Internal Testing RUNBOOK

Førstegangs-guide. Følg sektionerne i rækkefølge. **iOS først.** Android i Del E
efter iOS er live i TestFlight.

> Bundle ID: `app.lovable.a65f5c861a844640b1394767189347ea`
> App-navn: `taekwondo-power-plan` (vises som "Sports Talent" i Xcode senere)

---

## Del A — Konti og udstyr (1–2 dage)

1. **Apple Developer Program** — $99/år
   - https://developer.apple.com/programs/enroll/
   - Godkendelse: 1–48 timer (kan tage længere ved firma)
2. **Google Play Console** — $25 engangsbeløb (gem til senere)
   - https://play.google.com/console/signup
3. **Mac med Xcode 15+** (kun til iOS)
   - Mac App Store → "Xcode". ~15 GB, 30–60 min download.
   - Åbn Xcode én gang → accepter licens → lad det installere ekstra komponenter.
4. **Android Studio** (kun til Android — kan udskydes)
   - https://developer.android.com/studio
5. **Node.js 20+**
   - https://nodejs.org → LTS installer
6. **Git**
   - macOS: kommer med Xcode CLI tools (`xcode-select --install`)

---

## Del B — Hent kodebasen lokalt (15 min)

1. I Lovable: klik **+** i chat-input nederst → **GitHub → Connect project**.
2. Authorize Lovable GitHub-app, vælg konto, klik **Create Repository**.
3. Lokalt i Terminal:
   ```bash
   git clone https://github.com/<DIN-GITHUB>/<REPO-NAVN>.git sportstalent
   cd sportstalent
   npm install
   ```

> Fra nu af: ændringer i Lovable pushes automatisk til GitHub. Lokalt skal du
> køre `git pull` før hvert nyt build.

---

## Del C — Build & Capacitor setup (30 min, kun første gang)

```bash
npm run build
npx cap add ios
# Android springer vi over indtil iOS er live:
# npx cap add android
npx cap sync ios
```

**Generér app-ikon og splash** (kræver `@capacitor/assets`):

```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --ios
# Senere, når du tilføjer Android:
# npx capacitor-assets generate --android
```

Dette læser `resources/icon.png` og `resources/splash.png` (allerede lagt i
repoet af Lovable) og genererer alle størrelser til iOS-projektet.

---

## Del D — iOS TestFlight (3–4 timer første gang)

### D1. Åbn projektet i Xcode
```bash
npx cap open ios
```

### D2. Konfigurér signing
1. Vælg **App** target i venstre panel.
2. Fanen **Signing & Capabilities**.
3. **Team:** vælg dit Apple Developer team (efter Apple-godkendelsen er gået igennem).
4. **Bundle Identifier:** skal være `app.lovable.a65f5c861a844640b1394767189347ea`.
5. Lad "Automatically manage signing" være tændt.

### D3. Tilføj permissions i Info.plist
Åbn `ios/App/App/Info.plist` (højreklik → Open As → Source Code) og indsæt
INDEN den afsluttende `</dict>`:

```xml
<key>NSCameraUsageDescription</key>
<string>Sports Talent bruger kameraet til at optage og analysere kampvideoer.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Sports Talent skal kunne tilgå dit fotobibliotek for at uploade kampvideoer og profilbilleder.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Sports Talent kan gemme analyserede videoer og rapporter til dit fotobibliotek.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Sports Talent bruger mikrofonen til at optage lyd sammen med kampvideoer.</string>
```

### D4. Opret app i App Store Connect
1. https://appstoreconnect.apple.com → **My Apps → +** → New App
2. **Platform:** iOS
3. **Name:** Sports Talent (eller anden navn — du kan ændre)
4. **Primary Language:** Danish
5. **Bundle ID:** vælg `app.lovable.a65f5c861a844640b1394767189347ea` (dukker op efter Xcode-signing er sat)
6. **SKU:** `sportstalent-ios-001` (frit valg)
7. **User Access:** Full Access

### D5. Archive & upload
1. I Xcode topbar: vælg **Any iOS Device (arm64)** som destination.
2. Menu: **Product → Archive** (5–10 min).
3. Når Organizer åbner: vælg arkivet → **Distribute App** → **App Store Connect** → **Upload** → følg wizard.
4. Vent 10–30 min på "Processing" mail fra Apple.

### D6. Aktivér TestFlight
1. App Store Connect → din app → fanen **TestFlight**.
2. Build er nu listet → klik build → udfyld **Test Information** (test-email, beskrivelse).
3. Besvar **Export Compliance**: vælg "No" til encryption (medmindre I bruger custom krypto — det gør I ikke).
4. **Internal Testing** → Add Testers → tilføj dig selv og dit team via App Store Connect-emails.
5. Du modtager TestFlight-invitation på din e-mail. Installér **TestFlight** fra App Store på iPhone → åbn invitation → installer.

---

## Del F — Backend redirect (10 min, FØR du tester login i app)

Lovable Cloud Auth skal kende din native app's redirect URL.

1. I Lovable: klik **View Backend** (cockpit-cog ikon i bunden af chat).
2. Auth → URL Configuration → **Redirect URLs**.
3. Tilføj: `app.lovable.a65f5c861a844640b1394767189347ea://`
4. Behold de eksisterende web-URLer urørt.

---

## Del G — Smoke-test (1 time)

På iPhone via TestFlight:

- [ ] App starter, splash vises kort, dashboard loader
- [ ] Login med email/password virker
- [ ] Google login virker (åbner browser, vender tilbage til app)
- [ ] Bottom-nav: Hub, Træn, Kalender, Dagbog, Chat — alle åbner
- [ ] Sprogskift virker (Indstillinger → Sprog)
- [ ] Offline: aktivér Flymode → tilføj log → deaktivér Flymode → log synkes
- [ ] Coach-mode skifter (hvis du er coach)
- [ ] Match-video upload starter (kameraadgang spørges)
- [ ] Diary-skriv virker
- [ ] Mental assessment kan udfyldes
- [ ] Luk app fuldstændigt → genåbn → du er **stadig logget ind** (Preferences-persistens)

Hvis alt OK → Del E (Android) når du er klar.

---

## Del E — Android Play Internal Testing (2–3 timer, KØR FØRST NÅR iOS ER LIVE)

```bash
git pull
npm install
npm run build
npx cap add android
npx cap sync android
npx capacitor-assets generate --android
npx cap open android
```

### E1. Keystore (KRITISK — backup ALDRIG slet!)
I Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle → Create new keystore**.

- **Keystore path:** `~/keystores/sportstalent-release.jks` (uden for repo!)
- **Password:** notér i 1Password
- **Alias:** `sportstalent`
- **Validity:** 25 år
- **First/Last Name:** dit navn
- **Organization:** Sports Talent

**Backup keystore-filen + passwords ET ANDET STED. Mistes den, kan du aldrig opdatere appen.**

### E2. Byg signed AAB
1. **Build → Generate Signed Bundle / APK → AAB → Next**
2. Vælg keystore → indtast passwords → vælg **release** → Finish.
3. Outputfil: `android/app/release/app-release.aab`.

### E3. Play Console upload
1. https://play.google.com/console → **Create app**
2. Udfyld: navn, sprog (Danish), App/Game (App), Free/Paid (Free).
3. Sidebar: **Testing → Internal testing → Create new release**.
4. Upload `app-release.aab` → udfyld release notes → **Save → Review → Roll out**.
5. **Testers** fane: opret email-liste → tilføj testere → kopiér opt-in URL.
6. Testere åbner URL på Android → installerer fra Play Store.

---

## Når der kommer en ny version

```bash
cd sportstalent
git pull
npm install        # kun hvis package.json ændret
npm run build
npx cap sync
```

**iOS:** `npx cap open ios` → Xcode → øg **Build** nummer i Signing → Archive → Upload → TestFlight aktiverer det automatisk efter processing.

**Android:** øg `versionCode` og `versionName` i `android/app/build.gradle` → Generate Signed Bundle → upload ny release i Play Console Internal Testing.

---

## Hvis noget går galt

- **"No signing certificate"** i Xcode → Apple Developer er ikke godkendt endnu, eller team ikke valgt.
- **Hvid skærm efter splash** → tjek at `capacitor.config.ts` IKKE har `server.url` sat (skal være tom for prod-build). Lovable har allerede sat dette korrekt.
- **Login bouncer ud** → tjek Del F (redirect URL) er tilføjet.
- **"App not installed"** på Android → keystore mismatch. Brug samme keystore som første upload.
- **Build fejler i Xcode** → `cd ios/App && pod install && cd ../..` og prøv igen.

---

Held og lykke! Når iOS er i TestFlight, skriv til Lovable så hjælper jeg med Del E.
