# Plan: Fremhæv de 4 understøttede sportsgrene på forsiden

## Kontekst

Forsiden (`src/pages/Index.tsx` linje 268–308) har allerede en "Enhver sport"-sektion med en række sport-pills. Nogle er markeret som aktive (guldfyldte), andre ikke. Problemet er at de aktive pills (håndbold, badminton, gymnastik) **ikke** svarer til de sportsgrene appen faktisk understøtter. Appen har konkrete sportprofiler for: **taekwondo, karate, kickboxing og fitness** (defineret i `src/config/sportProfiles.ts`).

gør opmærksom på at der hen ad vejen vil komme flere sportsgrene til.

Målet er at flette de 4 reelt understøttede sportsgrene ind på forsiden, så besøgende ser hvad platformen faktisk dækker i dag — samtidig med at budskabet om at "sporten skifter, kravene gør ikke" bevares.

## Ændringer

### 1. Nye oversættelsesnøgler (7 sprog)

Tilføj 4 nye nøgler i `src/i18n/translations.ts` for alle 7 sprog (en, da, sv, de, ar, no, es):

- `sportTaekwondo` — f.eks. "Taekwondo" / "Taekwondo" / "Taekwondo" etc.
- `sportKarate` — f.eks. "Karate"
- `sportKickboxing` — f.eks. "Kickboxing"
- `sportFitness` — f.eks. "Fitness" / "Fitness" / "Generel fitness" etc.

Disre navne matches mod `SPORT_PROFILES`-objektet (`name` / `nameEn` felter).

### 2. Opdater sport-pills på forsiden (`src/pages/Index.tsx`)

Nuværende pill-liste (linje 278–282):

```js
{ k: "sportFootball", on: false }, { k: "sportHandball", on: true }, ...
```

Ny liste — de 4 understøttede sportsgrene markeres `on: true` (guldfyldte) og placeres først. De øvrige sportsgrene beholder `on: false` som "kommer/snart":

```
Taekwondo (on), Karate (on), Kickboxing (on), Fitness (on),
Martial arts (off), Handball (off), Football (off), Swimming (off),
Athletics (off), Badminton (off), Cycling (off), Gymnastics (off),
Volleyball (off), Ice hockey (off), Basketball (off)
```

"+ Din sport" dashed pill forbliver til sidst.

### 3. Opdater sektionstekst

Opdater `homeSportsBody` og `homeSportsFootnote` i alle 7 sprog så teksten nævner de 4 konkrete sportsgrene:

- `homeSportsBody`: tilret så den siger noget i retning af "Fra taekwondo og karate til kickboxing og generel fitness — strukturen er den samme, indholdet er jeres."
- `homeSportsFootnote`: "Kører allerede i danske klubber inden for taekwondo, karate, kickboxing og fitness."

### 4. SEO / metadata

`homeSeoDesc` (index.html + PageMeta) behøver ikke ændres — den er allerede sport-agnostisk. Hvis ønsket kan den nævne de 4 sportsgrene, men dette er valgfrit og undlades for at holde ændringen minimal.

## Ikke en del af dette

- Ingen ændringer til `sportProfiles.ts` (client eller server)
- Ingen ændringer til `/platform`, `/funktioner` eller andre landingssider
- Ingen ændringer til Help/changelog (ren copy-ændring på forside, ikke et funktionsløft)