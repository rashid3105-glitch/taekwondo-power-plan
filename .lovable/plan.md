Opdater Health-sidens header efter den valgte "Cyberpunk cockpit dark"-retning: store knapper fjernes, sync og rapport bliver kompakte ikon-actions, og form-sektionen får glassmorphic overflade.

## Ændringer

### 1. Health.tsx — header-redesign
- Fjern de to fuldbreddes-knapper (`forceResync` og `downloadAIReport`).
- Brug det eksisterende pulssymbol (`Activity`) i en venstrestillet cirkel/knap som sync-trigger. Ved tryk køres `forceResync`; under sync vises en roterende/spinnende tilstand.
- Konverter AI 14-dages rapporten til en lille ikon-knap (`FileDown`) placeret i headerens højre side. Ved tryk køres `downloadAIReport`; under generering vises spinner.
- Behold titel (`healthPageTitle`) og undertekst (`healthPageSubtitleManual`).
- Tilføj `title`-attributter på de nye ikon-knapper for web-hover-hints (jævnfør projektregel).

### 2. ManualHealthEntryCard.tsx — glassmorphic form
- Behold alle felter og validering.
- Giv kortet semi-transparent baggrund med `backdrop-blur`, tynde borders og subtile skygger, så det matcher den valgte cockpit-stil.
- Bevar responsivt 2x2-grid på mobil.

### 3. Apple Health-række
- Behold nuværende række, men juster visuel stil så den passer til den nye header (samme overfladehøjde, ingen store knapper).

### 4. Design tokens
- Brug eksisterende semantiske tokens (`--card`, `--border`, `--muted`, `--primary`, `--self` til amber accent) i stedet for hardcodede farver.
- Tilføj nyt utility-klasser i `index.css` hvis glassmorphic varianter mangler.

## Ikke omfattet
- Ingen ændringer til native iOS/Android build.
- Ingen ændringer til HealthKit-logik, sync-algoritmer eller rapport-indhold.

## Verifikation
- Typecheck (`bunx tsc --noEmit` eller tilsvarende).
- Visuel kontrol i mobil preview: sync-ikon synligt, rapport-ikon synligt, form-sektion med blur/border-effekt.