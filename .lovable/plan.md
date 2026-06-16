## Mål
Når en coach skifter mellem klubber (fx Copenhagen City → UC Copenhagen), skal det være tydeligt at hele dashboardet nu viser den anden klub — ikke kun et tavst dropdown-skift.

## Hvor det implementeres
`ActiveClubContext` får en ny `switchingTo`-tilstand som sættes når `setActiveClubId` kaldes med en anden klub end den aktive. UI'et reagerer på den. Bagefter nulstilles den når data er reloadet (eller efter en kort fast varighed).

## Tre forslag — vælg én

### A) Cinematisk fuldskærms-overlay (anbefalet)
Et halvgennemsigtigt mørkt overlay glider ind oppefra i ~700 ms, midt på står:

```
SKIFTER KLUB
UC Copenhagen
```

med klubbens initial-monogram (rund badge med klubbens første bogstav) som anker. Fader ud når dashboard-data er klar. Føles som en "scene change" og gør det umuligt at overse.

- Pro: Maksimal tydelighed, premium følelse, matcher dark cockpit-æstetikken.
- Con: 700 ms ekstra ventetid pr. skift.

### B) Top-banner pulse + toast
- En tynd stribe i toppen af headeren lyser kort op i primary-farve med teksten "Aktiv klub: UC Copenhagen" og glider væk efter 2 s.
- Samtidig vises en top-center sonner-toast: "Skiftede til UC Copenhagen".
- Dropdown-pillen får et hurtigt scale + glow-pulse.

- Pro: Hurtigt, ikke-blokerende, bruger eksisterende toaster.
- Con: Mindre dramatisk; kan misses hvis man kigger nedad.

### C) Header-pille som "skifter" tilstand
Selve klub-pillen (ClubSwitcher-knappen) bliver til en kort animation:
1. Pillen skrumper kort sammen, ikon spinner.
2. Klubnavnet skifter med en lodret slot-machine-flip.
3. Pillen blusser i primary-farve i 1 s og slår sig til ro.
Ingen overlay, ingen toast — alt sker i selve switcheren.

- Pro: Stille, elegant, lokal til selve handlingen.
- Con: Stadig let at overse hvis blikket er nede i listen.

## Anbefaling
**A** giver dig "en gang for alle"-følelsen du har bedt om i tidligere fixes: det er umuligt at være i tvivl om hvilken klub du kigger på. Vi kan kombinere A + en kort confetti-fri pulse i headerens pille bagefter, så den nye aktive klub er fremhævet de første par sekunder.

## Implementering hvis A vælges
1. `ActiveClubContext`: tilføj `switchingTo: { id, name } | null` + sæt den i `setActiveClubId` når id ændres; ryd efter 700–900 ms.
2. Ny komponent `ClubSwitchOverlay` mountet i `App.tsx`: framer-motion `AnimatePresence` der viser overlay når `switchingTo` ikke er null.
3. Sprog: `switchingClub` (DA "Skifter klub", EN "Switching club", + SV/DE/AR/NO/ES).
4. Respect `prefers-reduced-motion` — fald tilbage til simpel fade uden bevægelse.

## Spørgsmål
Vil du have **A**, **B**, eller **C**? (Eller A + den lille pille-pulse bagefter?)
