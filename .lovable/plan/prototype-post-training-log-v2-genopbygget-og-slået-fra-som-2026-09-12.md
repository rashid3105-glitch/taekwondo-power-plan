# Prototype: Post-training log v2 — genopbygget og slået fra som standard

Prototypen bygges om fra bunden efter specifikationen og gøres klar i produktion, men den er slukket, indtil brugeren selv slår den til.

## Sådan slås den til

- Siden ligger på `/prototypes/post-training-log-v2` og er kun tilgængelig via direkte link — intet menupunkt.
- Som standard viser adressen en lille startskærm: titel, én linje om hvad prototypen er, og en knap "Slå prototypen til".
- Når man trykker på knappen, huskes valget i browseren, og prototypen vises fra da af. En diskret knap "Slå fra" øverst sætter den tilbage.
- Ingen andre brugere påvirkes, og resten af appen ser ingen forskel.

## Selve prototypen

- To iPhone-rammer side om side: atlet (Emil, 14) til venstre, træner (Sofia, af tre) til højre, med billedtekst under hver.
- Fem trin styret af Næste/Forrige og en Nulstil-knap, med trin-tæller 01 → 02 → 03 → 04 → 05 øverst.
  1. Låseskærm 19:45 med notifikationen "Training today?".
  2. Logningsark: status (Trained/Partly/Skipped), indsatsskala 1–10 med ord, notefelt, valg af hvem der ser det, Send.
  3. Kvittering hos atleten; ny række øverst i trænerens fælles kø.
  4. Trænerens svarvisning med to hurtige svar, fritekst og valg af modtager.
  5. Rækken markeres "Handled by Sofia · 19:52" og overstreges; atleten får svaret som besked plus søjlegraf for de sidste 14 dage.
- Nederst tabellen "Open Questions" med de fire rækker (Safeguarding markeret med accentfarven, Wording, The Parent, Accountability) i den leverede ordlyd.

## Teknisk

- Erstatter `src/pages/prototypes/PostTrainingLogV2.tsx`, `src/components/prototypes/IOSDevice.tsx` og `src/styles/prototypes/post-training-log-v2.css` med nye versioner.
- Projektet kører React Router (ikke TanStack), så ruten forbliver den eksisterende linje i `src/App.tsx`; ingen andre ruter, navigation eller layout røres.
- Metadata (titel, beskrivelse, og og:/twitter-felter samt `noindex`) sættes på siden selv via Helmet, som i dag.
- Al styling ligger i det scopede stylesheet under `.ptl-v2-scope`: tokens `--bg #f3f2f2`, `--ink #201e1d`, `--accent #ec3013`, `--surface #eae9e9`, `--panel #ffffff`, `--divider`, neutraler 100–900, radius 0 (kun telefonrammen er rund), Archivo med overskrifter i vægt 800 og brødtekst 15px/1.55, kicker 11px/800/0.12em versaler. Ingen globale selektorer, ingen ændringer i `src/index.css` eller Tailwind-temaet.
- Archivo-linket findes allerede i `index.html` og genbruges.
- Ingen shadcn-komponenter, ingen nye pakker, ingen datahentning, ingen auth — alt er `useState`.
- Til/fra-flaget gemmes under nøglen `ptl-v2-prototype-enabled` i browserens localStorage; ingen databaseændring.
- Afsluttes med typecheck og et gennemklik af alle fem trin i browseren.
