Gør det visuelt tydeligt, når en coach har skiftet væk fra sin primære klub, ved at give app-headeren en guld top-border.

Plan
----
1. Tilføj en CSS-regel i `src/index.css`:
   ```css
   body.coach-foreign-club .app-header {
     border-top: 3px solid hsl(var(--primary));
   }
   ```
   - `body.coach-foreign-club` sættes allerede af `ThemeSync`, når `hasCoachRole && activeClubId !== primaryClubId`.
   - `--primary` er guld i coach-tema, så borderen bliver guld automatisk.

2. Tilføj class `app-header` til `<header>` i `src/pages/Dashboard.tsx` (linje 705), så den viste header får guld top-border i fremmed-klub-tilstand.

3. Tilføj class `app-header` til `<header>` i `src/pages/CoachDashboard.tsx` (linje 346), så coach-oversigten også viser det samme visuelle signal.

Ingen nye state, hooks eller migrations. Ændringen genbruger den eksisterende `coach-foreign-club` body-class og den eksisterende guld-primary farve.