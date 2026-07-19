## Ændringer i `src/pages/Health.tsx`

### 1. Rødt pulserende hjerte som sync-knap
Erstat `Activity`-ikonet i sync-knappen (linje 501) med et rødt, fyldt `Heart`-ikon der pulserer konstant (subtil `animate-pulse`), og skifter til hurtig spin/scale når `resyncing` er aktiv.

- Ikon: `Heart` med `text-red-500 fill-red-500`
- Idle-tilstand: `animate-pulse` (blødt pulserende for at signalere "live")
- Aktiv sync-tilstand: bevar hurtig visuel feedback (fx `animate-ping`-glow eller behold `animate-pulse` men hurtigere via inline style)
- Glow-ringen bag ikonet (`bg-primary/20 blur`) ændres til `bg-red-500/30` så den matcher.

### 2. Fjern "blink" efter synk (rigtig fejl)
Årsagen til at skærmen blinker efter synk er `window.location.reload()` i to funktioner:
- `forceResync` (linje 117): `setTimeout(() => window.location.reload(), 600)`
- `connectAppleHealth` (linje 91): `setTimeout(() => window.location.reload(), 800)`

En fuld page-reload nulstiller React-træet → hvid flash. `load()` er allerede en almindelig funktion i komponenten, så vi kan erstatte begge reloads med `await load()`, hvilket kun genhenter data og opdaterer state — ingen flash.

### Ingen andre ændringer
- Ingen backend-, native- eller edge-function-ændringer.
- AI-rapport-knappen (FileDown) og Apple Health-kortet forbliver som de er.
