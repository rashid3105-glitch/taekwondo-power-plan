# Verifikation af fail-closed i ConsentGate

Alt nedenfor er læst i den kørende database og i `src/components/ConsentGate.tsx`. Intet er ændret.

## 1. Hvornår returnerer de tre queries `error`?

### Politikker (alle SELECT, alle PERMISSIVE, ingen RESTRICTIVE nogen steder)

`profiles` (RLS til, ikke FORCE):
- "Users can view their own profile" — `auth.uid() = user_id` (role: public)
- "Admin can view all profiles" — `is_admin(auth.uid())`
- "Coaches can view athlete profiles" — findes i `coach_athletes`
- "Coaches can view club athletes profiles" — `is_coach_of_athletes_club(user_id)`
- "Parents read linked athlete profiles" — `is_parent_of(auth.uid(), user_id)`

`consent_records`:
- "Athlete reads own consent" — `auth.uid() = athlete_id`
- "Admin reads consent" — `is_admin(auth.uid())`
- "Coach of athlete club reads consent" — `is_coach_of_club(club_id)`
- "Linked parent reads consent" — `is_parent_of(auth.uid(), athlete_id)`

`parent_athletes`:
- "Parents read own links" — `parent_user_id = auth.uid() OR athlete_id = auth.uid()`
- "Coaches read parent links for their athletes", "Club coaches read parent links for clubmates", "Superadmin read all"

`clubs` (bruges via embed `clubs:club_id(name)`):
- "Members, coaches and admins can view clubs" — admin eller egen `club_id`

Rettigheder: alle fire tabeller har fulde tabel-grants til `anon`, `authenticated`, `service_role`. Ingen kolonne-specifikke grants. Fremmednøglen `profiles.club_id → clubs.id` findes, så embedded select er gyldig.

**a) Hvornår error frem for tom liste?** Ikke ved RLS. Error opstår kun ved: transportfejl (offline, DNS, timeout, "Failed to fetch"), 401/403 fra et udløbet eller ugyldigt token, 5xx fra API'et, eller PostgREST-fejl (ukendt kolonne, brudt embed, eller `maybeSingle()` som får mere end én række → PGRST116).

**b) Kan en RLS-afvisning på SELECT give error?** Nej. Med grants på plads filtrerer RLS bare rækkerne væk: 0 rækker, `error = null`. Fail-closed på RLS er derfor reelt en illusion for netop disse tre queries. Fail-closed fanger i praksis kun transport-, token- og API-fejl.

**c) PERMISSIVE eller RESTRICTIVE?** Alle er PERMISSIVE. Der findes ingen RESTRICTIVE-politik og ingen `USING (false)` på nogen af de tre tabeller.

## 2. Hvem rammer fejlskærmen?

Koden bruger (linje 76–92):
- `profiles`: `.select("role, active_role, birth_date, age, guardian_email, club_id, clubs:club_id(name)").eq("user_id", uid).maybeSingle()`
- `consent_records`: `.select("status, grace_until").eq("athlete_id", uid).eq("consent_type","health_data_processing").maybeSingle()`
- `parent_athletes`: `.select("id").eq("athlete_id", uid).limit(1)`

**a) Bruger nogen `.single()`?** Nej. Ingen af de tre. 0 rækker giver `null` uden fejl. Men `maybeSingle()` fejler ved **flere end én** række (PGRST116). Målt i dag: ingen dubletter — 0 brugere med to `profiles`-rækker, 0 atleter med to `health_data_processing`-rækker (83 rækker i alt i `consent_records`). Risikoen er fremtidig, ikke aktuel.

**b) Pr. rolle:**
- Træner uden atletprofil: har selv en `profiles`-række (egen-politik gælder for alle roller) → ingen fejl; `consent_records` 0 rækker → `null`; `parent_athletes` 0 rækker → tom liste. `role`/`active_role` er ikke "athlete" → `kind: "ok"`. Ingen blokering.
- Forælder: samme forløb → `kind: "ok"`.
- Admin: samme → `kind: "ok"` (medmindre admin også er markeret som atlet).
- Bruger med profil uden `consent_records`-række: `maybeSingle()` → `null`, ingen fejl. Er brugeren atlet, følger den normale samtykkelogik.
- Bruger **uden** `profiles`-række (nyoprettet, hvor triggeren ikke er kørt endnu): `maybeSingle()` → `null` uden fejl → ikke atlet → `ok`.

**c) Kolonner/tabeller en rolle ikke må læse?** Nej. Ingen kolonne-grants er indskrænket, og embeddet mod `clubs` er lovligt for alle. En bruger uden klubadgang får blot `clubs: null`, ikke en fejl.

## 3. `consent_age_for_athlete`

SECURITY DEFINER: ja. Kan kaldes af `anon`, `authenticated` og `service_role`. I `src/lib/age.ts` er kaldet pakket i try/catch, og både `error`, `null` og værdier uden for 1–25 giver fallback til 18. Den kaster ikke og kan ikke selv udløse fejlskærmen — men bemærk: hvis den kastede, ville det ryge i ConsentGates ydre `catch`, som nu er fail-closed.

## 4. Dom

**Ja — den nye fail-closed kan spærre legitime brugere ude, men ikke af den grund den blev bygget til.**

- Mod RLS fanger den intet: RLS-afvisning på SELECT giver tom liste, aldrig `error`. Beskyttelsen mod "afvist læsning tolkes som ikke-atlet" eksisterer ikke i praksis for disse tre queries.
- Til gengæld rammer den alle **tilgængelighedsfejl**: offline eller ustabilt net, kortvarig 5xx, og især et udløbet/ikke-fornyet token ved app-start. Alle brugere — atleter, trænere, forældre, admins — får så en fuldskærmsblokering med log ud som eneste reelle udvej, i en app der ellers er bygget offline-first.
- Fremtidig dubletrække i `profiles` eller `consent_records` giver PGRST116 og spærrer den pågældende bruger ude, selvom vedkommende har gyldigt samtykke.

**Hvad der skal ændres, hvis det skal rettes** (ikke udført):
1. Skeln mellem fejltyper i stedet for at fail-close på alt: kun rigtige autorisationssvar (401/403, PostgREST-koder 42501/PGRST301) bør give `kind: "error"`. Netværks-/timeout-/5xx-fejl bør give den eksisterende ikke-blokerende `warn`-tilstand med prøv-igen.
2. Behandl PGRST116 (flere rækker) som `warn`, ikke som blokering — det er en datafejl, ikke en samtykkefejl.
3. Vil man reelt fail-close på manglende læseadgang, skal det ske serverside (en SECURITY DEFINER-funktion eller edge function, der eksplicit svarer "kunne ikke fastslå samtykkestatus"), ikke ved at aflæse `error` fra en RLS-filtreret select.
4. Skift til `.limit(1)` + `[0]` frem for `maybeSingle()` på de to opslag, så dubletter aldrig kan spærre en bruger.
