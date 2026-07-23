## Mål
Gør `/auth` konsistent med klub-only beslutningen: siden viser kun **Log ind** + en tydelig **Opret trænerkonto**-vej. Atleter kan udelukkende oprette sig via invitationslink fra deres træner (`/join/:code` → `/invite-signup`).

## Ændringer

### 1. `src/pages/Auth.tsx`
- Fjern `signup`-tilstanden helt fra denne side. `isLogin` bliver altid `true`; toggle-linket "Har du ikke en konto? Opret" fjernes.
- Fjern `handleSubmit`s hele `else`-gren (atlet-signup, invite-kode-validering, `signUp`-kald, `pendingEmail`-state, "Tjek din indbakke"-skærmen).
- Fjern felterne `displayName` + `inviteCodeInput` + `signupInviteHint` fra formen. Behold e-mail + password + forgot password + passkey/biometri.
- Fjern "Er du træner? Opret trænerkonto her."-linket i sin nuværende diskrete form.
- Under login-formen tilføjes en tydelig sekundær CTA-blok:
  - Overskrift: "Er du træner eller klub?"
  - Kort tekst: "Opret en trænerkonto og inviter dine atleter."
  - Knap → `/signup/coach`
- Under den: en lille hjælpelinje til atleter der lander her ved en fejl: "Er du atlet? Du kommer ind via invitationslinket fra din træner." (ingen knap — bevidst).
- Håndtér `?tab=signup` og `?invite=…` ved at redirecte til `/signup/coach` hhv. `/invite-signup?code=…`, så gamle links ikke bryder.
- Bevar logikken der anvender en gemt `pending_invite_code` efter login (så en atlet der klikkede et invitationslink først og loggede ind bagefter stadig får sin klub tilknyttet).

### 2. Ingen ændringer nødvendige i
- `/signup/coach` (`SignupCoach.tsx`) — fortsat den eneste selvbetjente signup-vej.
- `/join/:code` og `/invite-signup` — atleters eneste indgang.
- `Index.tsx` / landing-CTA'er — de peger allerede på `/auth` (log ind) og `/signup/coach`.

### 3. Oversættelser (`src/i18n/translations.ts`)
Tilføj nye nøgler i alle 7 sprog (da, en, sv, de, ar, no, es):
- `authCoachCtaTitle` — "Er du træner eller klub?"
- `authCoachCtaBody` — "Opret en trænerkonto og inviter dine atleter."
- `authCoachCtaButton` — "Opret trænerkonto"
- `authAthleteHint` — "Er du atlet? Du kommer ind via invitationslinket fra din træner."

Fjern (eller lad ligge ubrugte) atlet-signup-nøgler som `createAthleteAccount`, `signupInviteLabel`, `signupInviteHint`, `signupInvitePlaceholder`, `signupInviteRequired`, `signupInviteInvalid`, `signupAsCoachLink`, `passwordRequirementsHint` — de er ikke længere brugt på /auth (behold i filen for at undgå bredere refaktor).

### 4. `PageMeta`
Opdatér title/description til kun at handle om login, da signup ikke længere findes her.

### 5. Changelog (`src/pages/Help.tsx`)
Tilføj `changelogEntry180` (v1.4.4, 23. juli 2026):
- "Atleter oprettes nu udelukkende via invitationslink fra deres træner. /auth er ren login-side."

## Teknisk note
Ingen database-ændringer. Ingen ændringer i RLS, edge functions eller Stripe. Rent frontend/UX.
