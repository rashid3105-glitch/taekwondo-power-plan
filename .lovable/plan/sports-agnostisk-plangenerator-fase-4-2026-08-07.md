# Sports-agnostisk plangenerator (Fase 4)

Målet: plangeneratoren skal bygge konkrete sessioner ud fra klubbens sport, atletens mål og den ugentlige træningsplan — i stedet for at antage taekwondo overalt.

## Hvad der er i dag
- `generate-plan` edge-funktionen er hårdkodet til taekwondo: system-prompten taler om "taekwondo athletic performance", og hele programmet forgrener sig kun på sparring vs. poomsae.
- Sportsprofilerne (taekwondo, karate, kickboxing, fitness) findes kun på klienten i `src/config/sportProfiles.ts` og bruges i dag udelukkende af admin-forhåndsvisningen.
- Session-typen "tkd" er hårdkodet i planformatet og vises som "Taekwondo" i dagsvisningen — også for karate-, kickboxing- og fitnessklubber.
- Onboarding kalder funktionen med tom body, hvilket giver fejlen "Missing profile data" og betyder at nye atleter ikke får en plan automatisk.

## Sådan bygges det

### 1. Delt sportstaksonomi til serveren
Læg en server-kopi af sportsprofilerne i `supabase/functions/_shared/sportProfiles.ts` (samme felter: navn, gradlabel, færdighedslabel, færdighedsgrupper, konkurrenceformater, sessionslabel, om sporten har kampanalyse). Klienten beholder sin fil som kilde; serverkopien holdes identisk.

### 2. Sportsbevidst prompt i `generate-plan`
- Funktionen slår selv atletens `club_id` op og finder klubbens `sport` (falder tilbage til taekwondo, så eksisterende klubber er uændrede).
- System-prompten bygges dynamisk: sportens navn, sportsspecifikke krav (eksplosivitet/kontakt for kampsport, styrke/kondition for fitness), sportens færdighedsgrupper som kontekst for teknik-nære cues, og sportens sessionslabel.
- Disciplin-forgreningen (sparring/poomsae) bruges kun når sporten faktisk har den skelnen; for karate bruges kumite/kata, for kickboxing konkurrenceformat, for fitness ingen disciplin — i stedet atletens mål og træningsniveau.
- Atletens mål, ugeskema, antal ugentlige klubtræninger, programlængde, skader og aktiv sæsonfase bevares som input præcis som i dag.

### 3. Generisk session-type
Planformatet beholder feltnavnet `tkd` for bagudkompatibilitet med gemte planer, men får betydningen "klubtræning". I visningen (`src/components/DayDetail.tsx` og de øvrige plan-visninger) hentes etiketten fra sportsprofilen, så karateklubber ser "Karate-træning" og fitnessklubber "Træningspas". Tekster som "Follow your dojang's programming" gøres sportsneutrale.

### 4. Ret onboarding-kaldet
Onboarding sender i dag tom body. Funktionen udvides til selv at hente atletens profil fra databasen, når `profile` mangler, så baggrundsgenereringen faktisk lykkes.

### 5. Kaldsteder
Dashboard og coach-visningen sender profilen videre uændret — sporten resolveres på serveren, så der kræves ingen ændring af body-formatet.

## Teknisk
- Ændrede filer: `supabase/functions/generate-plan/index.ts`, ny `supabase/functions/_shared/sportProfiles.ts`, `src/components/DayDetail.tsx` plus de plan-visninger der viser session-typebadges.
- Ingen databasemigrering: `clubs.sport` findes allerede fra fase 1.
- Ingen ændring af gemte planers JSON-struktur — kun etiketter og prompt.
- Alle nye brugervendte tekster tilføjes på alle 7 sprog via `t()`.
- Help.tsx + changelog opdateres.
