# Native app review-tjek — audit + review-noter

Formålet er at sikre at appen kan reviewes uden risiko for afvisning på (a) 3.1.1 skjulte payment-referencer og (b) "incomplete functionality" hvis reviewer ikke forstår adgangsmodellen.

---

## Del A — Audit-resultater

### Korrekt gated på native (OK)
- `UpgradeGate.tsx` — viser neutral "not available" uden CTA
- `UpgradeModal.tsx` — separat native-variant uden "Se planer"
- `Dashboard.tsx` — alle `/pricing`-CTAs bag `!isNativeApp()`
- `Onboarding.tsx` — springer post-onboarding pricing-redirect over på native
- `SubscriptionSettings.tsx` — viser "managed" besked, ingen portal/stripe
- `Pricing.tsx` — `native` flag sat (checkout/portal-kald bør allerede være blokeret)

### Potentielle leaks der bør verificeres/lukkes

1. **`CoachDashboard.tsx` linje 401 og 418**  
   `onClick={() => window.location.href = "/priser"}` — ingen `isNativeApp()`-guard. På native vises knappen sandsynligvis stadig og lander på pricing-siden. **Skal gates.**

2. **`FeatureDetail.tsx` linje 304**  
   `<Button onClick={() => navigate("/pricing")}>` uden native-guard. **Skal gates eller skjules på native.**

3. **`PublicNav.tsx` / `LandingLayout.tsx` / `GlobalAppMenu.tsx`**  
   Public nav og footer indeholder `/pricing` og `/priser` links. Hvis native-appen nogensinde viser public nav / landing (fx før login, eller via "Om"/menu), er der en direkte vej til pricing. Skal enten:
   - filtrere pricing-links ud af nav-arrays når `isNativeApp()`, ELLER
   - bekræfte at native-appen ALDRIG rammer disse layouts (kun `/auth` → `/dashboard`).

4. **`/pricing`-route i `App.tsx`**  
   `<Route path="/pricing" element={<Navigate to="/#pricing" replace />} />` — redirect'en gør at direkte navigation på native lander på Landing-siden. Landing.tsx har `<Link to="/pricing">` (linje 589). Anbefaling: på native skal `/pricing`, `/priser`, `/#pricing` alle redirect'e til `/dashboard`.

5. **`PaymentSuccess.tsx`**  
   Reachable kun via Stripe-redirect (bør aldrig ramme native), men "back to pricing"-knappen er ikke native-gated. Lav-risiko men luk for sikkerheds skyld.

6. **Landing.tsx (`/`)**  
   Sælgende landing-page med pricing-link. Hvad ser en native-bruger ved app-launch før login? Hvis Landing vises, er hele salgsflowet synligt for reviewer. Skal bekræftes at native går direkte til `/auth` eller `/dashboard`.

### Ikke-verificeret (kræver runtime-check før submission)
- Findes der en aktiv demo-konto med `is_demo=true` og `demo_full_access=true`?
- Hvad ser en logget-ind bruger UDEN klublicens og UDEN demo på native? (Skal have klar "kontakt din klub"-besked, ikke tom skærm.)

---

## Del B — Review-noter (klar til copy-paste)

### App Store Connect → "Notes for Review" (EN, primær)

```
DEMO ACCOUNT (full access, please use this to review)
Email:    [INDSÆT demo-email]
Password: [INDSÆT demo-password]

ABOUT SPORTSTALENT
Sportstalent is a B2B platform for sports clubs (primarily
taekwondo, expanding to other sports). Clubs purchase a
license on our website — the app itself is a tool for the
club's coaches, athletes, and parents.

SUBSCRIPTION MODEL — WHY THERE IS NO PURCHASE IN THE APP
Subscriptions are sold exclusively to club administrators
via our website (sportstalent.dk), never inside the app.
Individual users (athletes, coaches, parents) get access
automatically once their club has an active license.

The app therefore intentionally contains no purchase flow,
no pricing pages, no upgrade CTAs, and no links to any
external payment surface. This design complies with
Guideline 3.1.3(b) "Multiplatform Services" and 3.1.1.

HOW TO TEST (5 minutes)
1. Launch the app and tap "Log in".
2. Enter the demo credentials above.
3. You land on the athlete dashboard, tab "Today".
4. Bottom navigation:
     Today · Training · Calendar · Diary · Chat
5. Explore modules from "Today" (training plan, mental
   performance, nutrition, physical tests, video analysis,
   rehab, competitions, season calendar). All are unlocked
   on the demo account.
6. To see the COACH experience: tap the avatar (top-right)
   → "Switch to coach mode". Bottom nav changes to:
     Team · Training · Competitions · Messages · Me
7. Log out from the avatar menu.

LANGUAGES
The app supports 7 languages (EN, DA, SV, DE, AR, NO, ES).
Default follows device language. Arabic is right-to-left.

CONTACT
Any questions during review: [INDSÆT support-email]
We usually reply within a few hours.
```

### Google Play Console → "Instructions for reviewers"
Samme tekst som ovenfor virker fint på Play. Play er mindre streng på 3.1.1-ækvivalenten men "incomplete functionality"-risikoen er den samme.

---

## Del C — Anbefalet rækkefølge før submission

1. Ret de 3 sikre leaks (CoachDashboard × 2, FeatureDetail, PublicNav/Landing pricing-links).
2. Tilføj native-redirect på `/pricing` og `/priser` routes → `/dashboard`.
3. Bekræft at ikke-licenseret + ikke-demo bruger ser en klar "kontakt din klub"-besked (ikke tom skærm).
4. Opret / verificér demo-kontoen og test hele flowet i en TestFlight-build.
5. Indsæt demo-credentials i review-noterne og submit.

Punkt 1-3 er kodeændringer. Sig til hvis du vil have mig til at gennemføre dem — så gør jeg det i én build-tur.
