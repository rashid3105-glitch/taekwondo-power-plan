# Klubspecifikt drill-bibliotek med coach-upload

Drills bliver klubbens eget bibliotek: coaches uploader/tilføjer direkte på siden, admin-siden fjernes, og der er ingen globale drills.

## Sådan bliver det

**Siden `/library/drills`**
- Titel følger klubbens sport: "Taekwondo-drills", "Karate-drills", "Kickboxing-drills", "Drills" (fitness). Dette bruger den eksisterende sport-logik.
- Kun drills fra brugerens egen klub vises. De 2 eksisterende globale drills fjernes.
- Coaches ser en "Tilføj drill"-knap øverst plus rediger/slet på hver række. Atleter ser kun listen.

**Tilføj drill (coach)**
To muligheder i samme dialog:
1. YouTube-link — ubegrænset antal, fylder ingen plads (anbefales som standard).
2. Videofil-upload — max 10 MB pr. fil, max 5 uploadede videoer pr. klub. Tælleren vises ("3 af 5 brugt"), og upload-feltet låses ved 5 med en besked om at bruge YouTube i stedet.

Uploadede videoer ligger i privat lagring og afspilles kun for klubbens egne medlemmer via midlertidige links.

**Kategorier (sportsuafhængige)**
Teknik · Kombinationer · Fodarbejde · Sparring/Kamp · Kondition · Andet.
De taekwondo-specifikke kategorier (taegeuk, poomsae) vises kun for taekwondo-klubber.

## Best practice-anbefalinger

- YouTube (unlisted) som standardvej: gratis, ubegrænset, streamer godt på mobil. Upload reserveres til korte klip coachen ikke vil have på YouTube.
- 10 MB rækker til ca. 20-40 sekunder telefonvideo — nok til én teknik-demo. Vi viser en tydelig besked hvis filen er for stor, med tip om at trimme klippet.
- Privat lagring + tidsbegrænsede links, så klubbens interne materiale ikke kan deles offentligt.
- Kun MP4/MOV/WebM tillades.
- Sletning af en drill frigiver kvoten igen.

## Teknisk

- Tabel `taekwondo_drills` omdøbes til `club_drills`; `club_id` gøres påkrævet (NOT NULL) og de 2 globale rækker slettes. Nye kolonner: `storage_path`, `file_size_bytes`, `source` ('youtube' | 'upload'), `duration_seconds` (valgfri).
- RLS: klubmedlemmer kan læse egen klubs drills; coaches/admin i klubben kan oprette, opdatere og slette. GRANTs til `authenticated` + `service_role`.
- Kvote håndhæves i en BEFORE INSERT-trigger: max 5 rækker med `source='upload'` pr. `club_id` — ikke kun i UI.
- Privat storage-bucket `club-drills` med RLS-politik på `storage.objects`, filsti `<club_id>/<drill_id>.<ext>`; afspilning via signed URL. 10 MB tjekkes både klientside og via `file_size_bytes`-constraint.
- `src/components/DrillLibrary.tsx` udvides med coach-CRUD, uploadflow og kvotetæller; ny `src/components/library/DrillFormDialog.tsx`.
- `src/pages/AdminDrills.tsx` og ruten `/admin/drills` fjernes, samt link i admin-menuen.
- Kategorinøgler og alle nye tekster oversættes til alle 7 sprog i `src/i18n/translations.ts`.
- Help.tsx opdateres med afsnit om klubbens drill-bibliotek + changelog v1.5.28.
