# Test og gem GAL-licens som Jens Jensen

## Handling
1. Opret en sikker, midlertidig preview-session for Jens Jensens identificerede atletkonto.
2. Åbn appen som Jens og gå til **Profil → Rediger profil**.
3. Find GAL-licensfeltet, indtast `DEN-9999`, og gem gennem brugerfladen.
4. Kontrollér både den synlige successtatus i appen og den gemte værdi i databasen.
5. Hvis GAL-feltet ikke vises på atletens aktuelle redigeringsside, stoppes testen uden en direkte databaseændring, og den præcise UI-mangel rapporteres som årsagen.

## Teknisk kontrol
- Ingen andre profilfelter må ændres.
- Testen udføres med Jens' egen brugeridentitet, så samme adgangsregler og endpoint bruges som ved almindelig atletredigering.
- Den forventede slutværdi er `profiles.gal_license = 'DEN-9999'` for Jens Jensen.
