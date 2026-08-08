# Klubspecifikke drills med coach-upload

Drill-biblioteket bliver udelukkende klubbens eget — ingen globale, taekwondo-farvede drills på tværs af klubber. Coaches opretter selv drills direkte på drill-siden: enten som YouTube-link (gratis, ingen plads) eller som uploadet videofil med fair use-grænser.

## Hvad brugeren oplever

**Coach (på /library/drills)**
- Ny knap "Tilføj drill" øverst på siden (kun synlig for coaches i klubben).
- Formular: titel, kategori, beskrivelse, og valg mellem:
  - YouTube-link (anbefalet — tæller ikke mod klubbens kvote)
  - Upload video (maks 10 MB, mp4/mov/webm)
- Hver klub kan have maks 5 uploadede videoer. Kvotelinje vises: "3 af 5 videoer brugt (12 MB)". Når kvoten er fuld, deaktiveres upload-valget med en venlig besked om at bruge YouTube-link i stedet.
- Coach kan redigere og slette klubbens egne drills (sletning fjerner også filen og frigiver kvote).

**Atlet/medlem**
- Ser kun sin egen klubs drills. Uploadede klubvideoer afspilles inline i appen; YouTube-links åbner som i dag.
- Tom tilstand hvis klubben ikke har oprettet noget endnu: "Din klub har ikke lagt drills op endnu."

**Sport-neutralitet**
- De eksisterende globale drills (taekwondo-specifikke) fjernes fra visningen. De arkiveres i databasen (sættes inaktive) frem for at blive slettet permanent, så intet går tabt.
- Kategorierne gøres sport-drevne: fælles kategorier (teknik, kombinationer, fodarbejde, sparring/kamp, kondition) plus sportens egne fra sportsprofilen — i stedet for hårdkodede taegeuk/poomse. Drill-titlen på siden bruger allerede sportens term.
- Admin-siden for drills fjernes fra admin-menuen (klub-coaches ejer nu indholdet).

## Best practice-anbefalinger

- YouTube (eller Vimeo) som standard: unlisted-video koster ingen lagerplads, streamer bedre på mobil og aflastes helt af udbyderen. Upload bør være undtagelsen til korte klip uden konto.
- 10 MB rækker til ca. 20-40 sek. i 720p. Vis en tydelig hjælpetekst: "Optag kort, i 720p, og hold klippet under 30 sekunder."
- Privat bucket + signerede URL'er (ikke offentlig bucket), så klubbens interne materiale ikke kan deles ud af huset.
- Kvote håndhæves både i UI og i databasen (trigger), så grænsen ikke kan omgås.
- Filstørrelse og filtype håndhæves på bucket-niveau, ikke kun i browseren.
- Slet altid filen sammen med drill-rækken, ellers "lækker" kvoten.

## Teknisk

**Database (migration)**
- Tilføj til `taekwondo_drills`: `storage_path text`, `file_size_bytes bigint`, `source text` ('youtube' | 'upload', default 'youtube').
- `club_id` gøres påkrævet for nye rækker; eksisterende globale rækker sættes `is_active = false`.
- RLS omskrives: medlemmer læser kun aktive rækker for deres egen klub; coaches (`is_coach_of_club(club_id)`) kan oprette, rette og slette egne klub-drills. Admin-policies bevares til support.
- Trigger `enforce_club_drill_quota()` før INSERT: afvis hvis klubben allerede har 5 rækker med `source='upload'`, eller hvis `file_size_bytes > 10485760`.

**Storage**
- Ny privat bucket `club-drills` med `file_size_limit` 10 MB og mime-typer mp4/quicktime/webm.
- RLS på `storage.objects`: sti-prefix `{club_id}/...`; klubmedlemmer kan læse, klub-coaches kan uploade/slette.

**Frontend**
- `src/components/DrillLibrary.tsx`: coach-tilstand (knap, kvotelinje, rediger/slet), sport-drevne kategorier, inline afspilning via signeret URL, ny tom-tilstand.
- Ny `src/components/drills/DrillFormDialog.tsx`: opret/rediger med YouTube-link eller filupload, klientside-validering af 10 MB og kvote.
- `src/pages/AdminDrills.tsx` og dens rute/menupunkt fjernes.
- Nye i18n-nøgler for alle 7 sprog; `src/pages/Help.tsx` opdateres med afsnit + changelog-bump.
