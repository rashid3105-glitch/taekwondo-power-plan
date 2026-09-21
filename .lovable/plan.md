# Deaktivering og sletning af klubber

Adminsiden for klubber får to nye handlinger: deaktiver (pause med 30 dages fortrydelse) og slet permanent (kun tomme klubber).

## Sådan kommer det til at virke

**Deaktiver klub**
- Knap på hvert klubkort. Bekræftelse med klubbens navn før noget sker.
- Alle klubber kan deaktiveres, også med medlemmer. Medlemmerne mister adgang til klubbens indhold med det samme (samme spærring som en klub uden licens).
- Klubben vises tydeligt som "Deaktiveret" med dato for, hvornår de 30 dage udløber.

**Genaktiver**
- Inden for 30 dage kan klubben sættes i drift igen med ét klik. Alt indhold og alle medlemskaber er urørt.

**Efter 30 dage**
- Klubben markeres "Klar til sletning" på adminsiden. Intet slettes automatisk.
- Har klubben stadig medlemmer, kan den ikke slettes — du får besked om, hvor mange der skal flyttes eller fjernes først.

**Slet permanent**
- Kun mulig for en deaktiveret klub uden aktive medlemmer og uden brugere, hvis profil peger på klubben.
- Kræver, at du skriver klubbens navn for at bekræfte. Handlingen kan ikke fortrydes.
- Alt klubrelateret indhold fjernes: hold, teknikker, drills, sæsonplaner, aktivitetstyper, modulindstillinger, trænerinvitationer, klubanalyser, landingsindhold samt klublogo og andre klubfiler.

**Filter**
- Det eksisterende licensfilter får et ekstra valg: "Deaktiverede" med tæller, så de ikke blander sig i den daglige liste.

## Teknisk

**Database (én migration)**
- Genbruger den eksisterende kolonne `clubs.deleted_at` som deaktiveringstidspunkt; ny kolonne `deactivated_by uuid`.
- `admin_deactivate_club(_club_id uuid)` / `admin_reactivate_club(_club_id uuid)` — security definer, afviser alt andet end `is_admin(auth.uid())`.
- `admin_delete_club(_club_id uuid)` — security definer, kræver: admin, `deleted_at` sat, 0 rækker i `club_memberships` med status `active`, 0 rækker i `profiles` med det `club_id`. Sletter derefter i afhængighedsrækkefølge de tabeller, der peger på `clubs` uden `ON DELETE CASCADE`, og lader klubbens egen række slette resten via cascade. Returnerer jsonb med antal slettede rækker pr. tabel.
- Klublogo og upload under klubbens prefix fjernes fra storage via et lille kald i adminsiden efter vellykket sletning (storage kan ikke slettes fra SQL).

**Frontend**
- `src/pages/AdminClubs.tsx`: henter `deleted_at`, nyt filtervalg, badge + udløbsdato, tre handlinger med bekræftelsesdialog (`AlertDialog`), navnebekræftelse ved permanent sletning.
- `src/components/LicenseGate.tsx` og `src/hooks/useEntitlements.ts`: behandler `deleted_at IS NOT NULL` som spærret klub (useEntitlements henter allerede feltet).
- `src/contexts/ActiveClubContext.tsx`: deaktiverede klubber udelades af superadmins virtuelle klubliste.
- Nye tekster i `src/i18n/translations.ts` på alle syv sprog.
- Changelog i `src/pages/Help.tsx` (v1.5.74).

Ingen ændring af retention-jobbet, tørkørselsflagene eller Stripe. Intet deployes uden din godkendelse.
