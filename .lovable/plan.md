## Fase 3 — Aktiv-klub-kontekst (plan, ingen kodeændringer)

### Designprincip: nul effekt for enkelt-medlemsbrugere
Al ny adfærd gates på `memberships.length > 1`. Når en bruger har præcis ét aktivt medlemskab:
- Vælgeren rendres ikke.
- `activeClubId` = den ene klubs id (= dagens `profiles.club_id`).
- `role_in_club` på det ene medlemskab matcher den globale rolle (verificeret af backfill i Fase 1).
- Resultat: RoleContext, ThemeSync, CoachDashboard-filtre, og skrive-defaults producerer samme output som i dag.

Verifikation indbygges som en lille selvtest (dev-warning) der logger hvis `activeClub.role_in_club !== profile.role` for enkelt-medlemsbrugere — så vi opdager evt. backfill-huller før noget brydes.

---

### 1. ActiveClubContext (ny fil: `src/contexts/ActiveClubContext.tsx`)

State:
```
type Membership = { club_id: string; club_name: string; role_in_club: "athlete"|"coach"|"admin"; status: string };
{
  memberships: Membership[];      // status='active'
  activeClubId: string | null;
  activeMembership: Membership | null;
  setActiveClubId: (id: string) => void;
  loading: boolean;
}
```

Init-flow (rækkefølge er kritisk for ikke at flashe forkert tema):
1. `loading=true` indtil session + memberships er hentet.
2. På auth-session: `SELECT club_id, role_in_club, status FROM club_memberships WHERE user_id = uid AND status='active'`, joinet med `clubs.name`.
3. Vælg activeClubId i denne prioritet:
   a. localStorage `activeClubId:{userId}` hvis stadig i listen.
   b. Eneste medlemskab hvis kun ét.
   c. Medlemskab der matcher `profiles.club_id` (primær).
   d. Første i listen (alfabetisk på klubnavn).
4. Persistér på `setActiveClubId`.
5. Ryd ved logout.

Provider monteres i `App.tsx` **inden** `RoleProvider` og `ThemeSync` (de skal læse fra den).

Fallback hvis bruger ikke har nogen rækker i `club_memberships` (defensivt): fald tilbage til `profiles.club_id` + global `profiles.role` — dvs. nuværende adfærd. Logges som warning.

---

### 2. Klub-vælger (`src/components/ClubSwitcher.tsx`)

- Lille dropdown med klubnavn + rolle-badge.
- Renderes **kun** når `memberships.length > 1`. Ellers `return null`.
- Skifte-handler: `setActiveClubId(id)` → context propagerer → RoleContext/ThemeSync re-evaluerer → coach-queries refetcher.

Placering:
- `src/pages/Dashboard.tsx` header (ved siden af avatar).
- `src/pages/CoachDashboard.tsx` header.
- (Ikke i bottom-nav; ikke nødvendigt i sidemenu i denne fase.)

---

### 3. RoleContext + ThemeSync ændringer

`src/contexts/RoleContext.tsx`:
- Tilføj afhængighed af `useActiveClub()`.
- Når `memberships.length > 1` og `activeMembership` findes: `role = activeMembership.role_in_club === 'coach' || 'admin' ? 'coach' : 'athlete'`.
- Når `memberships.length <= 1`: behold nuværende logik (læs fra `profiles.role` + `profiles.roles`). → identisk adfærd.
- `hasCoachRole` = true hvis **noget** medlemskab har role_in_club='coach'/'admin' ELLER profiles.roles indeholder 'coach'. (Bevarer Farooq-fix på tværs af klubber.)

`src/contexts/ThemeSync.tsx`:
- Uændret logik; trækker `role` fra RoleContext som nu. Da RoleContext nu afhænger af aktiv klub, skifter temaet automatisk korrekt når bruger med flere klubber bytter (blå athlete-klub → guld coach-klub).
- Enkelt-medlemsbruger: ingen ændring.

---

### 4. CoachDashboard.loadAthletes

`src/pages/CoachDashboard.tsx` linjer ~155-249:
- Fjern: `coachProfile.club_id` lookup.
- Brug: `const clubId = activeClubId`.
- Atletliste hentes via RPC `get_club_member_profiles({ _club_id: clubId })` — uændret call-shape.
- Slet client-side fallback `athletes.filter(a => a.club_id === coachClubId)` til fordel for en RPC der filtrerer via `club_memberships`. **Alternativ for denne fase (mindst risiko):** behold RPC men supplér med `SELECT user_id FROM club_memberships WHERE club_id=activeClubId AND role_in_club='athlete' AND status='active'` og merge — dvs. queryen returnerer atleter der har et atlet-medlemskab i den aktive klub, ikke kun dem hvor `profiles.club_id` matcher.
- For en coach med kun én klub: activeClubId === gammelt coachClubId → identisk resultatsæt (verificeres i test).

Tilsvarende gennemgås (læsninger der i dag bruger `profiles.club_id`):
- `src/pages/CoachAthleteOverview.tsx` — bruger profile lookup, behold men sørg for at access-tjek går via membership.
- `src/pages/CoachSurveys.tsx`, `src/pages/CoachModules.tsx`, `src/pages/AdminModuleAccess.tsx` — switch `coachProfile.club_id` → `activeClubId`.
- `src/components/coach/CoachNotes.tsx` (delt-i-klub-tjek) — brug activeClubId.
- `src/lib/seasonCalendar.ts`, `src/pages/SeasonCalendar.tsx` — brug activeClubId for plan-scoping.
- `src/components/coach/InviteDialog.tsx` — invitér til activeClubId.

---

### 5. Skrivninger: sæt `club_id = activeClubId`

Ved INSERT i klub-specifikke tabeller skal `club_id` nu eksplicit sættes til `activeClubId` (i stedet for at lade backfill/trigger gætte). Berørte skrive-steder:

| Tabel | Filer der INSERT'er |
|---|---|
| `diary_entries` | `src/pages/Diary.tsx`, `src/lib/diarySyncEngine.ts` |
| `training_plans` | edge fn `generate-plan` (athlete's active club fra metadata), evt. `src/pages/Programs.tsx` |
| `rehab_plans` | edge fn `generate-rehab-plan` |
| `health_data` / `wearable_*` | `src/pages/Health.tsx`, `health-sync-simple` edge fn |
| `coach_messages` | `src/components/SendReminderDialog.tsx` flow, `send-coach-message` |
| `coach_athlete_notes` | `src/components/coach/CoachNotes.tsx` (coach-side: activeClubId) |
| `coach_reflection_comments` | coach reflection-flow |
| `event_reminders` | `src/components/SendReminderDialog.tsx` |
| `athlete_modules` | `src/pages/AthleteModules.tsx`, `src/pages/CoachModules.tsx` |

For athlete-skrivninger: `club_id = activeClubId` (athletes default-medlemskab = nuværende `profiles.club_id`).
For coach-skrivninger: `club_id = activeClubId` (coach's valgte klub).
Edge functions skal acceptere optional `club_id` i payload; hvis fraværende fald tilbage til `profiles.club_id` (bagudkompatibelt).

RLS-policies opdateres IKKE i denne fase — vi skriver kun data korrekt. Policy-skifte til membership-baseret check sker i Fase 4.

---

### 6. Filer der røres

Nye:
- `src/contexts/ActiveClubContext.tsx`
- `src/components/ClubSwitcher.tsx`

Ændres:
- `src/App.tsx` (provider-rækkefølge)
- `src/contexts/RoleContext.tsx`
- `src/pages/Dashboard.tsx` (header-slot)
- `src/pages/CoachDashboard.tsx` (header-slot + loadAthletes)
- `src/pages/CoachAthleteOverview.tsx`
- `src/pages/CoachSurveys.tsx`
- `src/pages/CoachModules.tsx`
- `src/pages/AdminModuleAccess.tsx`
- `src/components/coach/CoachNotes.tsx`
- `src/components/coach/InviteDialog.tsx`
- `src/pages/SeasonCalendar.tsx`, `src/lib/seasonCalendar.ts`
- Skrive-stederne fra tabellen ovenfor (kun `club_id`-felt tilføjes til insert payloads)
- `src/i18n/translations.ts` (label for vælger på alle 7 sprog: `activeClub`, `switchClub`)

IKKE rørt:
- `ThemeSync.tsx` (uændret kode — får ny adfærd gratis via RoleContext)
- RLS-policies / migrations
- `profiles.club_id` (bevares som "primær klub")

---

### 7. Risici & test

Risici:
- **Flash af forkert tema** ved cold load → afbødes ved `loading=true` indtil memberships er hentet; ThemeSync læser først når loading er færdig.
- **Backfill-huller**: bruger uden membership-rækker → fallback til profiles.club_id (defensiv).
- **Coach med kun én klub får anderledes atletliste** hvis membership-backfill missede nogen → derfor selvtest-warning + manuel sammenligning under test.
- **localStorage stale**: bruger fjernes fra klub → ryddes når activeClubId ikke længere er i memberships-listen.

Testmatrix:
1. **Enkelt-athlete (typisk bruger)**: dropdown skjult, blå tema, dagbog/plan virker, INSERTs får korrekt club_id. Forventet: pixel-identisk med før.
2. **Enkelt-coach (fx Farooq i én klub)**: dropdown skjult, guld tema, CoachDashboard viser samme atleter som før (diff'es mod nuværende prod-data).
3. **Dobbeltmedlem (test-user: athlete i klub A, coach i klub B)**: dropdown synlig, skift A↔B → tema skifter blå↔guld, atletliste skifter, en ny dagbogspost får `club_id=activeClubId`.
4. **Coach i to klubber**: skift mellem klubber → CoachDashboard viser hver klubs atleter; nyoprettet event_reminder havner i den aktive klub.
5. **Logout/login**: activeClubId persisteres pr. user_id; ny bruger på samme device får sin egen default.
6. **Backfill-hul (simuleret: slet membership-række)**: app crasher ikke; fald tilbage til profiles.club_id.

Rollout: feature kan deployes uden migration. Hvis problemer opstår, kan ActiveClubProvider hardkodes til `memberships=[]` → fuld fallback til gammel adfærd.
