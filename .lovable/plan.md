## Mål
Du sidder fast på login i preview, selvom serveren godkender dit password (auth-loggene viser status 200 for rashid3105@gmail.com kl. 21:39:02 og 21:39:49). Det betyder at fejlen ligger i klienten *efter* `signInWithPassword` returnerer — sandsynligvis et opfølgende kald der fejler med `TypeError: Load failed` og blokerer navigationen til `/dashboard`.

## Diagnose-trin (først, ingen kode-ændringer)
1. Åbn preview-URL'en i en **ny browser-fane** (ikke iframe). Hvis login virker dér, er det bekræftet at det er Lovable preview-iframens fetch-proxy der dræber Supabase-kald — det er en kendt preview-begrænsning, især i Safari.
2. Hvis #1 også fejler: åbn DevTools → Network, log ind, og find det første røde kald efter `POST /auth/v1/token`. Send mig navnet, så fikser jeg det.

## Hvis fejlen ligger i koden (sandsynlige kandidater)
Gennemgang af `src/pages/Auth.tsx` viser at `handleSubmit` kalder `navigate("/dashboard")` direkte efter login uden at vente på at sessionen er fuldt etableret. Hvis et af følgende fail'er på Dashboard-mount inden React har en gyldig session, kan UI'et hænge:

- `useEntitlements` / `check-subscription` edge function
- `ActiveClubProvider` der henter `club_memberships` (ny i Fase 3)
- `useOfflineProfile` / `update-my-profile`
- `health-sync-simple` (kun iOS)

### Ændringer (kun hvis trin 1 viser det er kode-fejl, ikke preview-proxy)

**A) `src/pages/Auth.tsx`** — gør login-flowet robust:
   - Erstat den direkte `navigate()` med en `await supabase.auth.getSession()`-poll (max 1s) før redirect, så React-kontekster når at se sessionen.
   - Wrap `signInWithPassword` med en eksplicit error-toast hvis kaldet kaster `TypeError: Load failed` (preview-proxy fejl) med besked om at åbne i ny fane.

**B) `src/contexts/ActiveClubContext.tsx`** — defensiv loading:
   - Hvis `club_memberships`-fetch fejler, sæt `loading = false` og `memberships = []` i stedet for at hænge i loading. Det forhindrer at hele appen freezes hvis et enkelt kald fejler i preview.

**C) Console-fejl `TypeError: Load failed`**:
   - Find afsenderen via tilføjelse af `console.error("source:", err)` i de 3-4 mest sandsynlige fetch-steder, så vi kan se hvilket kald der bryder.

## Hvad jeg IKKE rører
- RLS, migrations, edge functions (medmindre #1 + Network-tab peger entydigt derhen)
- Selve `signInWithPassword`-kaldet
- Supabase-klient-konfigurationen

## Næste skridt
Først: prøv at åbne https://id-preview--a65f5c86-1a84-4640-b139-4767189347ea.lovable.app/auth i en **ny fane** (ikke i Lovable-editoren) og fortæl mig om login virker dér. Det afgør om vi skal fikse kode (A+B+C) eller om det er en ren preview-iframe-begrænsning der ikke kan løses uden at publicere.
