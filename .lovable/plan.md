## Mål

Coachen skal kunne tilføje, redigere og slette sine egne teknikker i den dropdown der vises på skærmbilledet (sparring- og poomsae-listen i video-tagging).

## Tilgang

- Genbrug den eksisterende tabel `public.club_techniques` (samme der bruges i Sæson-kalenderen) — ingen migration nødvendig.
- Adgang via eksisterende RLS: alle klubbens coaches kan tilføje/redigere/slette, alle klubbens atleter kan læse.
- Indbyggede TKD-teknikker (Rundspark, Bagspark osv.) **bevares** og vises altid øverst som låste standardværdier. Klubbens egne teknikker tilføjes under en separator nederst i samme dropdown.

## Ændringer

### 1. `src/components/match/VideoTagger.tsx`

- Hent profil → `club_id`, derefter `club_techniques` filtreret på `club_id` + `discipline IN (video.discipline, 'both')`, sorteret alfabetisk.
- Udvid `<Select>` til at vise to grupper:
  - **Standard** (indbyggede, oversatte labels — gemmes ved `key` som i dag)
  - **Klubbens teknikker** (gemmes ved `name` som tekst)
- Når et tag vises, slå op i begge lister; ukendte værdier vises som rå tekst (bagudkompatibelt).
- Når `isCoach`: lille blyantsknap ved siden af dropdown'en åbner ny dialog.
- Rundspark ændres til cirkelspark
- Bagspark til bagudspark

### 2. Ny `src/components/match/ClubTechniquesDialog.tsx`

- Liste over klubbens egne teknikker for den aktuelle disciplin (sparring/poomsae).
- Felter pr. række: navn, kategori (attack/defense/transition), disciplin (sparring/poomsae/begge).
- Tilføj-knap øverst, blyant/skraldespand pr. række, bekræft før sletning.
- Bruger direkte `supabase.from("club_techniques")` — RLS sikrer adgang.
- Når dialogen lukkes, re-fetcher VideoTagger sin liste.

### 3. Offentlig delings-side (`MatchShare.tsx`)

- Viser allerede rå `tag.technique` som fallback når key ikke kendes → custom teknikker virker automatisk uden backend-ændringer.

### 4. Oversættelser

~7 nye nøgler i `src/i18n/translations.ts` for alle 7 sprog (manage teknikker, klubbens teknikker, standard, tilføj, navn, ingen endnu, slet-bekræftelse).

## Out of scope

- Ingen schema-ændringer eller edge function-ændringer.
- Indbyggede teknikker kan ikke redigeres/slettes (kun klubbens egne).
- Ingen ændringer i offline-cache for video tagging.