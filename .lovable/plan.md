## Bug 1 — Android viser dashboardet i halv bredde

**Diagnose:** `index.html` har korrekt `viewport` meta. `index.css` mangler dog en global `overflow-x` / `max-width` lås på `html`/`body`/`#root`. Det betyder at hvis ét element på siden er bredere end viewport (fx en chart, en lang ord-streng, et billede uden `max-width`, eller en grid der ikke wrapper), så bliver hele dokumentet bredere end skærmen og Samsung Internet zoomer ud — præcis det Kaihan ser (indhold klemt sammen til venstre, sort til højre, watermark følger kun den smalle kolonne).

**Fix:**
1. I `src/index.css` tilføj i `@layer base`:
   ```css
   html, body, #root {
     max-width: 100vw;
     overflow-x: hidden;
   }
   ```
   Defensiv, påvirker ikke nuværende layout, men forhindrer at ét uvelkomment element trækker hele siden bred.

2. Find den faktiske synder ved at scanne `src/pages/Dashboard.tsx` og dets hub-komponenter for elementer med:
   - explicit `width:` / `min-width:` i px > 320
   - `<img>` uden `max-width:100%` (vi har en global regel for `img`, men inline-bg kan slippe igennem)
   - lange ord/URLs uden `break-words` / `truncate`
   - horisontalt scrollable wrappers uden `min-w-0` på flex-children
   Ret den/de fundne synder (typisk: tilføj `min-w-0`, `truncate`, eller `max-w-full`).

3. Verificér ved at åbne `/dashboard` i preview ved 360×800 (Android-ækvivalent) og bekræfte at indholdet fylder hele bredden uden vandret scroll. Brug devtools "elements bredere end viewport" tjek.

Ingen ændringer til viewport meta, capacitor config eller PWA-laget.

## Bug 2 — Coach-managed atlet kan ikke selv lave rehab-plan

**Diagnose:** I `src/pages/Dashboard.tsx` linje 1141/1195 er rehab-generator og aktiver/slet-knapper gated bag `(!hasCoach || isPaid)`. Kaihan er coach-managed og ikke selvbetalende → han ser kun MedicalDocumentTranslator + en tom side.

Modul-adgang i sig selv er fin: `club_module_defaults.rehab = true` for Copenhagen City. Eneste blokering er det ovenstående UI-gate.

**Fix:** Du har valgt at generatoren altid skal vises når modulet er enabled. Konkret:

1. **Linje 1141:** Fjern `{(!hasCoach || isPaid) && (...)}`-gating omkring rehab-generator-blokken. Den skal altid renderes når vi er forbi `isTabModuleDisabled`/`isDemo`/`isModuleLocked` checks (som allerede er på plads).

2. **Linje 1171:** Fjern `hasCoach && !isPaid ? undefined :` fra `onDelete` på `RehabPlanCard`. Atleten skal kunne slette sin EGEN selvgenererede plan.

3. **Linje 1195:** Fjern `{(!hasCoach || isPaid) && (...)}` omkring aktiver/slet-knapperne i previous-rehab-plans listen, så atleten kan skifte mellem og slette sine egne historiske planer.

**Vigtig afgrænsning:** Disse handlinger rammer kun atletens EGNE rehab_plans-rækker (RLS sikrer at `user_id = auth.uid()`). Coach-tildelte planer (hvis sådanne findes via en anden user_id eller en assigner-kolonne) skal ikke kunne slettes af atleten. Hvis `rehab_plans` har en `assigned_by_coach`/`source` kolonne, brug den til at vise slet-knap kun for atlet-genererede rækker. Hvis ikke (mest sandsynligt — alle rækker er `user_id = atleten`), så er den fulde fjernelse safe.

**Bevar:** "Your programs are managed by your coach"-banneret øverst på hub forbliver — det er informativt og separat fra rehab-fanen.

## Teknisk afgrænsning

- Rør IKKE: RLS, edge functions, database, ActiveClubContext, NAV_ITEMS, bottom nav, entitlements.
- Filer der ændres: `src/index.css` (global overflow-x), `src/pages/Dashboard.tsx` (3 gating-fjernelser i rehab-blokken) og evt. 1–2 hub-komponenter hvis kilde til overflow findes.
- Ingen changelog (begge er bugfixes).

## Verifikation

- **Bug 1:** Åbn `/dashboard` i preview på 360×800, ingen vandret scroll, content fylder bredden. Bed Kaihan reloade på Android.
- **Bug 2:** Som Kaihan: åbn hamburger → "Skade-genoptræning" → skriv en skade → "Generér plan" virker → planen vises → "Slet" virker.