## Mål

Appen skal kunne åbnes og bruges uden internet — både som web/PWA og som native iOS/Android-app — og synkronisere ændringer, når nettet kommer tilbage.

## Hvad jeg fandt (verificeret i koden)

1. **Hvid skærm på web/PWA skyldes to konkurrerende service workers.** `public/sw.js` er en håndskrevet push-only worker uden cache, og `vite-plugin-pwa` genererer også `/sw.js` med precache af app-shell. Filen i `public/` overskriver den genererede ved build, så appen har i praksis **ingen offline-cache** — derfor blank skærm uden net.
2. **Ingen navigations-fallback.** Workbox-konfigurationen cacher kun billeder/scripts/fonts, ikke selve HTML-dokumentet, så SPA-ruter kan ikke åbnes offline.
3. **"Åbner, men ingen data" skyldes `supabase.auth.getUser()`.** Det er et netværkskald og bruges 170 steder (bl.a. `Dashboard.tsx`, `useOfflineDiary.ts`, `ReadinessCard.tsx`). Offline fejler det eller hænger — flere steder sender det brugeren til `/auth`. `getSession()` læser fra lokal storage og virker offline.
4. **Der findes allerede solid offline-infrastruktur**: IndexedDB + outbox + sync-engines for dagbog, træningslog, readiness, mental, coach-mental, fysiske tests, stævne-refleksion, plan, profil og videoanalyse. Den mangler bare at kunne køre, fordi shell/auth fejler.
5. **Ikke offline i dag**: sæsonkalender/holdplan og chat.

## Plan

### Fase 1 — App-shell der åbner offline (web + PWA)
- Omdøb `public/sw.js` til `public/push-sw.js` (kun push/notification-handlers, uændret logik) og opdatér `src/lib/pushNotifications.ts` til fortsat at bruge `/sw.js`.
- Lad `vite-plugin-pwa` (generateSW) eje `/sw.js` og indlæse push-workeren via `workbox.importScripts: ["/push-sw.js"]` — så én worker giver både push og offline-cache.
- Tilføj `navigateFallback: "/index.html"` med `NetworkFirst` for navigationer (deny-list for `/~oauth`, `/api`) og bevar `NetworkOnly` for backend-kald.
- Bevar de eksisterende guards: ingen registrering i Lovable-preview, iframe eller native runtime.

### Fase 2 — Offline-sikker login-tilstand
- Indfør en fælles hjælper `getCurrentUser()` i `src/lib/authSession.ts`, som bruger `getSession()` (lokal) og kun falder tilbage til netværk når man er online.
- Udskift `auth.getUser()` i de skærme, der skal virke offline: Dashboard, alle `useOffline*`-hooks, ReadinessCard, PhysicalTesting, MentalAssessment, Diary, PostCompetitionReflection, Profile.
- Fjern redirect til `/auth` når fejlen skyldes manglende netværk (kun redirect ved reelt manglende session).
- Native: sørg for at hydrering fra Capacitor Preferences ikke blokerer mount uden net (timeout findes allerede — udvides med offline-tjek).

### Fase 3 — Min plan + sæsonkalender offline (læsning)
- Ny `src/lib/seasonOfflineDB.ts`: cache klubbens sæsonplan, faser, dags-skabeloner og ugens teknikfokus i IndexedDB ved hver online-indlæsning.
- `SeasonCalendarView` (atlet) og "I dag"-kortet læser fra cache, når `navigator.onLine` er falsk, med "Sidst opdateret …"-mærkat.
- Individuel træningsplan bruger allerede `planOfflineDB` — sikres, at den også vises, når Dashboard indlæses offline.

### Fase 4 — Chat offline (læs + kø)
- Ny `chatOfflineDB` + `chatSyncEngine` i samme mønster som dagbogen: cache seneste ~100 beskeder pr. tråd, og læg nye beskeder i en outbox.
- Beskeder sendt offline vises med "afventer"-ikon og sendes automatisk ved reconnect (idempotent via klient-genereret nøgle).
- Realtime-abonnement genstartes ved reconnect, så tråden opdateres.

### Fase 5 — Synlighed og hjælp
- Udvid `OfflineBanner` med antal ventende ændringer og en "Synkronisér nu"-knap.
- Central sync-orchestrator, der kører alle sync-engines ved `online`-event og ved app-resume (native).
- Opdatér `src/pages/Help.tsx` med et afsnit om offline-brug + changelog v1.6.0, og tilføj nye tekstnøgler på alle 7 sprog.

## Tekniske detaljer

- Ingen databaseændringer er nødvendige; chat-outboxen bruger en klientgenereret idempotensnøgle mod eksisterende `chat_messages`.
- Workbox-strategier: `NetworkFirst` for HTML-navigationer, `StaleWhileRevalidate` for statiske assets, `NetworkOnly` for backend-domænet (auth/data må aldrig serveres fra cache).
- Native builds bruger ikke service worker — der løses offline udelukkende af Fase 2–4 (IndexedDB + lokal session).
- Efter merge kræves `git pull` → `npm install` → `npm run build` → `npx cap sync` for iOS/Android-builds.

## Uden for scope

Coach-administration, health-sync, ernæring, surveys og admin-sider forbliver online-only.
