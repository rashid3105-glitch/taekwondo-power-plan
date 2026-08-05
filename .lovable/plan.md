# Chat-redesign — "Elite noir conversation"

Chatten får det udseende, du valgte i mockup'en: mørk baggrund, guldkant på profilbillede, guld-bobler til dine egne beskeder, dæmpede grå bobler til modparten, en rolig samlet skrivelinje i bunden — og ingen stor rød "Luk"-knap.

## Sådan kommer det til at se ud

**Toppen af samtalen**
- Kompakt header: tilbage-pil, profilbillede med tynd guldring, navn, og en lille guld-tekst under navnet ("Aktiv nu" for personer / "X medlemmer" for grupper).
- Den røde Luk-knap bliver til en diskret guld-omridset knap i højre side.

**Beskederne**
- Datoskillere ("I dag", "I går", dato) mellem beskeder fra forskellige dage.
- Egne beskeder: guld boble med sort tekst, afrundet med "hale" i højre hjørne, blød guldskygge.
- Modtagne beskeder: mørk boble med tynd kant og lys grå tekst.
- Tidspunkt og "set"-markering som lille dæmpet linje under boblen — guld flueben når beskeden er læst.
- Reaktioner og billede/video-visning beholdes uændret, blot tilpasset farverne.

**Skrivefeltet**
- Alle knapper (billede, mikrofon, emoji), tekstfeltet og send-knappen samles i ÉN afrundet mørk bjælke, i stedet for løse knapper på række.
- Send-knappen er guld med sort ikon og et lille tryk-respons.
- Feltet vokser i højde ved lange beskeder, og placeholder-teksten bliver ikke længere klippet af.
- Bevarer sikker afstand til bunden på iPhone/Android (`pb-nav-safe`), så feltet ikke gemmer sig.

## Hvad der ikke ændres
Ingen ændringer i funktionalitet, database, offline-synkronisering eller push. Kun udseende.

## Teknisk

Filer der redigeres:
- `src/components/chat/Conversation.tsx` — ny header-opbygning, datoskillere i beskedlisten, tilpasset "Set"-række.
- `src/components/chat/MessageBubble.tsx` — nye boble-varianter (guld/neutral), justeret tidsstempel- og reaktionsstil.
- `src/components/chat/MessageComposer.tsx` — samlet afrundet komposer-bjælke med guld send-knap.
- `src/components/chat/ThreadList.tsx` — mindre tilpasning så listen matcher samme mørke/guld-udtryk.
- `src/index.css` (kun hvis der mangler en token) — eventuel `--chat-bubble`-token, så farverne er semantiske frem for hårdkodede.

Farver bruges via eksisterende semantiske tokens (`primary` = guld #D4AF37, `card`, `muted`, `border`), ikke hårdkodede hex-værdier i komponenterne. Ingen nye pakker.
