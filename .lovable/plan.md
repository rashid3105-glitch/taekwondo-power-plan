## Plan: Ret rolle-tilstand så den kun skifter ved bevidst valg

### Mål
Når en bruger har valgt **Træner** eller **Atlet**, skal den tilstand holdes fast på tværs af alle sider, menuer og navigation. Den må kun ændres, når brugeren aktivt vælger en anden rolle i rollevælgeren.

### Fejlen jeg fandt
Der ligger en eksplicit regel i højremenuen, som ved klik på **Hjem** sætter coach-mode til false. Kommentaren siger direkte, at Home altid skal føre til athlete hub. Det er præcis den adfærd, der nu er forkert.

### Ændringer
1. **GlobalAppMenu**
   - Fjern auto-skiftet fra coach til athlete i `goTab("hub")`.
   - Når brugeren er i coach-mode og klikker **Hjem**, skal navigationen gå til `/coach` eller coach-hjem — ikke nulstille til athlete.
   - Menupunkter skal respektere aktiv rolle:
     - Coach-mode: coach-relevante destinationer.
     - Athlete-mode: athlete-relevante destinationer.
   - Kun rollevælgerens knapper må kalde `setCoachMode(false/true)`.

2. **CoachModeContext**
   - Behold `localStorage` som persistent kilde (`tkd-coach-mode`).
   - Sikr at navigation til `/coach...` ikke utilsigtet ændrer den gemte bruger-valgte tilstand.
   - Tilstanden skal være “brugerens valg”, ikke “sidens rute”.

3. **Dashboard routing guard**
   - Behold auto-redirect fra `/dashboard` til `/coach`, når coach-mode er aktiv og man lander på hub.
   - Undgå at athlete-sider eller “Hjem”-klik kan nulstille coach-mode.
   - Førstegangscoach uden gemt valg kan stadig defaultes til coach én gang.

4. **CoachDashboard**
   - Fjern/undgå alle ikke-bevidste kald til `setCoachMode(false)`, undtagen hvis brugeren faktisk ikke har coach-adgang i den aktive klub.
   - Hvis en aktiv klub ikke giver coach-adgang, kan appen stadig sende brugeren til athlete-visning, fordi det er en adgangsregel — ikke et UI-valg.

5. **Navigation gennemgang**
   - Gennemgå top/højremenu, mobil bundnavigation og relevante “tilbage/hjem”-knapper for utilsigtede rolle-skift.
   - Rettelsen holdes frontend-only; ingen databaseændringer.

### Forventet resultat
- Kian vælger **Træner** i højremenuen.
- Han føres til coach-dashboard.
- Hvis han klikker **Hjem** eller navigerer rundt, bliver han fortsat i coach-mode.
- Han skifter kun til athlete, hvis han aktivt vælger **Atlet** i rollevælgeren.
- Samme princip gælder alle brugere med både athlete- og coach-adgang.