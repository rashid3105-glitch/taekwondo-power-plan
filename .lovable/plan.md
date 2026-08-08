# Klubspecifikke drills med coach-upload

Drill-biblioteket bliver klubbens eget: coaches kan selv oprette drills direkte på drill-siden — enten som YouTube-link (gratis, ingen plads) eller som uploadet videofil med fair use-grænser.

## Hvad brugeren oplever

**Coach (på /library/drills)**
- Ny knap "Tilføj drill" øverst på siden (kun synlig for coaches i klubben).
- Formular: titel, kategori, beskrivelse, og valg mellem:
  - YouTube-link (anbefalet — tæller ikke mod klubbens kvote)
  - Upload video (maks 10 MB, mp4/mov/webm)
- Hver klub kan have maks 5 uploadede videoer. Kvotelinje vises: "3 af 5 videoer brugt (12 MB)". Når kvoten er fuld, deaktiveres upload-valget med en venlig besked om at bruge YouTube-link i stedet.
- Coach kan redigere og slette klubbens egne drills (sletning fjerner også filen og frigiver kvote). Globale drills kan ikke redigeres af coaches.

**Atlet/medlem**
- Uændret visning, men uploadede klubvideoer afspilles inline i appen i stedet for at åbne YouTube.

**Admin**
- Den nuværende admin-side beholdes til globale drills på tværs af klubber (og som fallback for support). Klub-drills flyttes reelt ud til siden.

## Best practice-anbefalinger

- YouTube (eller Vimeo) som standard: unlisted-video koster ingen lagerplads, streamer bedre på mobil og virker offline-cachet af YouTube selv. Upload bør være undtagelsen til korte klip uden konto.
- 10 MB rækker til ca. 20-40 sek. i 720p. Vis en tydelig hjælpetekst: "Optag kort, i 720p, og hold klippet under 30 sekunder."
- Privat bucket + signerede URL'er (ikke offentlig bucket), så klubbens interne materiale ikke kan deles ud af huset.
- Kvote håndhæves både i UI og i databasen (trigger), så grænsen ikke kan omgås.
- Filstørrelse og filtype håndhæves på bucket-niveau, ikke kun i browseren.
- Slet altid filen sammen med drill-rækken, ellers "lækker" kvoten.

## Teknisk

**Database (migration)**
- Tilføj til `taekwondo_drills`: `storage_path text`, `file_size_bytes bigint`, `source text` ('youtube' | 'upload', default 'youtube').
- Nye RLS-policies: coaches i klubben (`is_coach_of_club(club_id)`) kan INSERT/UPDATE/DELETE rækker hvor `club_id` = deres klub. Globale rækker (`club_id is null`) forbliver admin-only. Eksisterende medlems-SELECT bevares.
- Trigger `enforce_club_drill_quota()` før INSERT: afvis hvis klubben allerede har 5 rækker med `source='upload'`, eller hvis `file_size_bytes > 10485760`.

**Storage**
- Ny privat bucket `club-drills` med `file_size_limit` 10 MB og mime-typer mp4/quicktime/webm.
- RLS på `storage.objects`: sti-prefix `{club_id}/...`; klubmedlemmer kan læse, klub-coaches kan uploade/slette.

**Frontend**
- `src/components/DrillLibrary.tsx`: tilføj coach-tilstand (knap, kvotelinje), inline afspilning af uploadede videoer via signeret URL.
- Ny `src/components/drills/DrillFormDialog.tsx`: opret/rediger med YouTube-link eller filupload, klientside-validering af 10 MB og kvote.
- Kategorier gøres sport-drevet som resten af appen (drills-labelen bruger allerede `drillsLabel`).
- Nye i18n-nøgler tilføjes for alle 7 sprog.
- `src/pages/Help.tsx`: kort afsnit + changelog-bump.
