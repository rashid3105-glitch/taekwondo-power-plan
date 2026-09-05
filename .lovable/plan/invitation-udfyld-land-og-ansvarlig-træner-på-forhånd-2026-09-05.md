# Invitation: udfyld land og ansvarlig træner på forhånd

## Hvad sker der i dag
- Invitationsopslaget (`get_invite_by_code`) returnerer kun klubnavn, trænernavn og id'er — ikke trænerens land.
- Når atleten opretter sig via invitationen, står landet tomt i profilen og skal vælges manuelt i profilopsætningen.
- Tilknytningen til den inviterende træner sker først, når invitationen bliver anvendt efter login (`apply_invite_to_my_profile` opretter rækken i træner/atlet-tabellen). Før det viser admins godkendelsesside ingen ansvarlig træner.

## Ændringer
1. Invitationsopslaget udvides, så det også returnerer den inviterende træners land (og træner-id, som allerede findes).
2. Ved oprettelse gennem et invitationslink sættes atletens land automatisk til trænerens land, hvis atleten ikke selv har valgt et. Feltet i profilopsætningen står derfor udfyldt på forhånd og kan stadig ændres.
3. Den inviterende træner sættes som ansvarlig træner ved samme lejlighed:
   - Ved oprettelsen gemmes træneren som "afventende træner" på profilen, så admin ser den rigtige træner allerede før godkendelse.
   - Når invitationen anvendes, oprettes/bekræftes tilknytningen som i dag.
4. Admins godkendelsesside vælger automatisk den inviterende træner i trænerlisten, når atleten kom via en invitation.

## Teknisk
- Migration: opdatér `get_invite_by_code` til også at give `coach_country` (fra trænerens profil), og `apply_invite_to_my_profile` til at sætte `profiles.country` fra trænerens profil, når feltet er tomt.
- `src/pages/InviteSignup.tsx`: send `country` (fra invitationens `coach_country`) og `pending_coach_id` med i signup-metadata; `handle_new_user` skal skrive dem til profilen.
- `src/pages/ProfileSetup.tsx`: intet nyt felt — landet kommer nu fra profilen og vises som forvalgt.
- `src/pages/AdminApproval.tsx`: brug `pending_coach_id` som fallback, når der endnu ikke findes en træner/atlet-tilknytning, så trænervælgeren står forudfyldt.
- Ingen nye tekster forventes; hvis der bliver behov, tilføjes de på alle syv sprog.

## Kontrol
- Opret en testbruger via et aktivt invitationslink og bekræft, at land og træner er udfyldt uden manuel indtastning.
- Bekræft i admin, at den rigtige træner står valgt før godkendelse.
- Bekræft, at en atlet, der selv har valgt et andet land, ikke bliver overskrevet.
