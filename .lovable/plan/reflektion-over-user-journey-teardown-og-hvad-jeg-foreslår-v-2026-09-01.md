# Reflektion over user journey-teardown — og hvad jeg foreslår vi gør

## Min vurdering af rapporten

Rapporten er skarp og for det meste korrekt. Jeg har verificeret de tungeste påstande i koden:

Bekræftet:
- **Ingen fødselsdato ved kontooprettelse.** `src/pages/InviteSignup.tsx` beder kun om navn, e-mail, password.
- **Modstridende pris-budskab.** Samme skærm siger "klubben betaler" og "Start 14 dages gratis prøveperiode" + "Intet kreditkort krævet".
- **Samtykke-porten vinker mindreårige igennem.** `ConsentGate.tsx`: er alderen under 18, returneres `ok` uden nogen forældre-kontrol. Porten fejler også åbent ved fejl.
- **Forældre-konti auto-bekræftes.** `supabase/functions/parent-signup` opretter brugeren med `email_confirm: true` — ingen mailboks-bevis, før forælderen kan se barnets helbredsdata.
- **Bundnavigationen kan ikke vise hvor man er.** Alle atlet-punkter i `AppBottomNav.tsx` har `active: false` hardkodet. Chat og dagbog er ikke i baren; Health og betinget Video er. Baren er skjult på `/dashboard` og `/messages`.
- **Klub-dropdown er en død kontrol.** `ProfileSetup.tsx` henter alle klubber og lader dig vælge, men `club_id` er bevidst udeladt af payload'en.
- **Taekwondo/engelsk hardkodet i mål-chips.** `"Faster kicks"` m.fl. sendes gennem `t()` som var de nøgler.

Delvist forkert:
- **Profil-formularen er 818 linjer, ikke 8.000.** Pointen holder alligevel — det er én lang formular med alt fra push-tilladelse til sletning af konto, og intet gemmes før den ene submit.
- Rapportens filnavne matcher ikke projektet (`OneClickSignup.tsx`, `AppAthleteNav.tsx` findes ikke). Den er skrevet ud fra en ældre eller rekonstrueret læsning, så enkelte detaljer skal verificeres før de rettes.

Min egen prioritering afviger let fra rapportens: **forældre-verifikation (nr. 2) er den jeg ville rette først**, fordi den er lille, isoleret i én edge function, og lige nu kan en hvilken som helst person med et invite-link få adgang til et barns helbredsdata uden at bevise at mailboksen er deres.

## Foreslået arbejdsrækkefølge

### Trin 1 — Mindreårige og forældre (kritisk)
- Krav om fødselsdato i invite-signup, før kontoen oprettes.
- Under 18: konto oprettes i afventende tilstand, værge-e-mail indsamles, atleten ser "venter på din forælder" i stedet for fuld adgang.
- `ConsentGate`: egen port for mindreårige; ukendt alder behandles som mindreårig, ikke som voksen.
- `parent-signup`: fjern auto-bekræftelse, send magic link til den inviterede adresse.
- Vis atleten hvem der er blevet koblet på.

### Trin 2 — Invitationens budskab og samtykke
- Én besked: "Din klub har betalt din plads — appen er gratis for dig" + én knap: "Acceptér invitation". Prøveperiode-sprog beholdes kun i klub/træner-flowet.
- Flyt vilkår/privatliv frem til kontotrinnet i to linjer: hvad klubben ser, hvad der forbliver privat.
- Bind invite-koden serverside ved signup i stedet for at afspille den fra browser-storage, plus en synlig "Kom du ind uden klub? Indsæt din kode".

### Trin 3 — Profilopsætning deles i to
- Tretrins førstegangsopsætning med gem pr. trin og spring over: fødselsdato, grad, disciplin, ugeskema.
- Alt andet (licenser, kaloriemål, synlighed, passkeys, sletning af konto) flyttes til en indstillingsside.
- Klubfeltet bliver read-only tekst med "Skift klub" via invite-kode; klub-forespørgslen fjernes fra siden.
- Mål-chips og standard-ugeskema flyttes ind i sport-profil-konfigurationen og nøgles til oversættelse på alle 7 sprog.
- Avatar gemmes atomisk ved upload, så de tre advarsler kan fjernes.
- Én alderslinje (den kalender-korrekte).

### Trin 4 — Navigation
- Én bundbar, fem faste destinationer, til stede på alle indloggede skærme inkl. chat.
- Aktiv tilstand udledt af rute + `?tab=`-parameter.
- Chat ind i baren; afklar om Health/Video hører hjemme der.

### Trin 5 — Upload og komposer
- Én upload-grænse på tværs af chat, opskriftsfoto og drills, oplyst før filvælgeren åbnes.
- Klientside-komprimering af billeder som madscanneren allerede gør.
- Enten fjern video fra chat-vælgeren eller send den ad drill-videoernes vej.
- Mikrofonen mærkes "Diktér" og bruger det aktive sprog i stedet for fast dansk.

### Trin 6 — Polish
- Login-skærmen bygges på samme tokens som resten af appen (eller det mørke guld-tema promoveres til rigtigt tema og bruges i signup og profilopsætning).
- Face ID-labelen erstattes af en neutral tekst på web-passkey-stien.
- Biometri-tilbuddet flyttes fra en browser-dialog til et kort på dashboardet, og et nej huskes.
- Hardkodede danske fejlstrenge på login gennem i18n.
- "Brug password i stedet" bliver en "eller"-skillelinje.
- Publikums-linje ("Din træner og din tilknyttede forælder kan se dette") på vægt, kaloriemål, skader og mentale svar.

## Teknisk note
Trin 1 rører `InviteSignup.tsx`, `ConsentGate.tsx`, `parent-signup` og `invite`-koden serverside samt en ny afventende-tilstand på profilen. Trin 3 er den største byggeopgave men uden backend-ændringer ud over sport-profil-konfigurationen. Trin 4 og 5 er ren frontend.

Rapportens to blinde vinkler — dashboard-hubben og trænerens side af chat/video — bør ses efter i drift, før vi konkluderer på dem.
