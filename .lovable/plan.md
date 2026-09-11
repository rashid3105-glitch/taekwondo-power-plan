# Videoanalyse: gennemgang og forslag

Gennemgang af videoværktøjet (`src/pages/MatchAnalysis.tsx`, `VideoTagger.tsx`, `VideoScrubber.tsx`, `VideoNotes.tsx`) og tabellerne bag. Nedenfor er kun ting, jeg har bekræftet i koden.

## Hvad der virker godt
- Tagging med teknik/side/udfald, klubdefinerede teknikker, matchrapport og opsummering.
- Offline-understøttelse af selve videoen og af tags (cache + kø).
- Tegning oven på billedet, delingslink med udløb, og korrekt oprydning: annotationer og noter slettes automatisk sammen med videoen.

## Problemer, jeg vil rette (prioriteret)

### 1. Billedfrekvensen er låst til 30 (høj)
Hele værktøjet regner med 30 billeder i sekundet. Optager du med 25, 50 eller 60, peger "Frame 412" og alle noter på et andet sted i videoen end der, hvor du satte dem. Noter gemmes som billednummer, så de flytter sig, hvis samme video vises et andet sted.
Løsning: mål den faktiske billedfrekvens ved indlæsning, gem noter i sekunder og vis billednummer beregnet ud fra den rigtige frekvens.

### 2. Billedtælleren halter under afspilning (høj)
Tælleren opdateres kun ca. 4 gange i sekundet, så tallet og skalaen står stille i ryk, mens videoen kører. Løsning: opdater pr. faktisk billede.

### 3. Tegninger kan kun slettes alle på én gang (høj)
Sletteknappen fjerner samtlige tegninger i hele videoen — også trænerens tidligere gennemgang. Der er ingen fortryd og ingen mulighed for at slette én tegning.
Løsning: "Fortryd sidste streg", "Ryd dette øjeblik" og en separat, bekræftet "Ryd hele videoen".

### 4. Tegninger forsvinder næsten med det samme (høj)
En tegning vises kun inden for 0,3 sekund omkring det sted, den blev lavet — altså under et halvt sekund. I praksis kan man ikke nå at se den under afspilning.
Løsning: en tegning bliver stående i et valgbart vindue (fx 2 sekunder) og videoen kan sættes på pause automatisk, når man rammer et markeret øjeblik.

### 5. Tre konkurrerende tidslinjer (mellem)
Der er skalaen med streger, en prikrække med tags nedenunder, og runde numre oven på billedet. De viser tre forskellige ting og forvirrer.
Løsning: én tidslinje med både tags og noter, farvet efter udfald; numrene oven på billedet fjernes.

### 6. Manglende basisværktøjer til gennemgang (mellem)
Ingen sløjfe/gentagelse af et udsnit, ingen hastighed under 0,25×, ingen tastaturgenveje uden først at klikke på videoen, ingen fuldskærm med værktøjerne.
Løsning: A–B-sløjfe, 0,1× og 0,5× ekstra, genveje (mellemrum, pil venstre/højre, komma/punktum) på hele siden.

### 7. Noter og tegninger virker ikke offline (mellem)
Videoen og tags kan bruges offline, men noter og tegninger går direkte mod nettet og fejler lydløst i hallen uden dækning.
Løsning: samme kø-model som tags.

### 8. Mobil (mellem)
Skalaen er tegnet til mus, knapperne er små, og tooltips kræver hover, som ikke findes på telefon. Tegnefladen er låst til 800 px bredde, så streger bliver upræcise på store skærme.
Løsning: større trykflader, tryk i stedet for hover, og tegneflade i skærmens egen opløsning.

### 9. Uoverensstemmelse om filstørrelse (lav)
Videosiden tillader 200 MB, mens appens fælles grænse for video er 30 MB. Ét af tallene er forkert — jeg foreslår at vi bekræfter det rigtige loft og bruger det ét sted.

### 10. Farver uden om temaet (lav)
Orange og rød er skrevet direkte ind flere steder i stedet for appens farver.

## Teknisk resumé
- Billedfrekvens: udled fra `requestVideoFrameCallback`/metadata; migrér `video_notes.frame_number` til sekunder (ny kolonne, bagudkompatibel læsning).
- Ydelse: `VideoTagger.tsx` er 975 linjer og gentegner alt ved hver tidsopdatering; udskil afspiller, tegning og tagpanel i egne komponenter med lokal tilstand.
- Tegning: tilføj `onDelete` pr. `video_annotations`-række; i dag findes kun `delete().eq("video_id", …)`.
- Offline: genbrug `matchOfflineDB`/`matchSyncEngine` til noter og annotationer.
- Alle nye tekster oversættes til alle 7 sprog.

## Foreslået rækkefølge
1. Punkt 1–4 (rigtig tid, levende tæller, forsvarlig sletning, synlige tegninger)
2. Punkt 5–6 (én tidslinje, sløjfe, genveje)
3. Punkt 7–8 (offline, mobil)
4. Punkt 9–10 (oprydning)
