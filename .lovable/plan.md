# Plan: Frivillig 2FA / MFA for alle brugere

## Mål
Give alle brugere (atleter, forældre, trænere og admins) mulighed for frivilligt at aktivere TOTP-baseret to-faktor-autentificering (2FA) via en autentificeringsapp. 2FA skal være valgfrit, og der genereres ikke gendannelseskoder.

## Forudsætning og afhængighed
Supabase Auth understøtter MFA/2FA, men funktionen skal aktiveres på projektniveau. Da dette er et Lovable Cloud-projekt uden adgang til Supabase-dashboardet, skal vi enten:
- anmode Lovable Cloud-support om at slå MFA til på projektet, eller
- aktivere det programmatisk via Supabase Management API, hvis det er tilgængeligt.

Resten af planen forudsætter, at backend-MFA er slået til.

## 1. Backend / auth-konfiguration
- Bekræft, at Supabase Auth MFA er aktiveret for projektet.
- Ingen nye tabeller er nødvendige — Supabase håndterer faktorer i `auth`-skemaet internt.
- (Valgfrit) Tilføj `mfa_enrolled_at` timestamp på `profiles` for at kunne vise status i UI.

## 2. Login-flow med MFA-udfordring
Opdater `src/pages/Auth.tsx`:
- Efter `signInWithPassword` tjekkes brugerens `aal`-niveau og aktive verificerede faktorer.
- Hvis brugeren har aktiveret 2FA, vises et ekstra trin, hvor brugeren indtaster 6-cifret TOTP-kode.
- Ved korrekt kode kaldes `mfa.verify`, og sessionen opgraderes til `aal2`, før brugeren sendes videre.
- Håndter fejl (forkert kode, udløbet kode) med toast-beskeder.

## 3. Opsætning og styring af 2FA i profilen
Opret ny komponent / sektion under profil/indstillinger:
- "Sikkerhed"-sektion med 2FA-status.
- Hvis 2FA ikke er aktiveret: knap "Aktiver 2FA".
- Ved aktivering:
  - Kald `mfa.enroll({ factorType: 'totp' })`.
  - Vis QR-kode og hemmelig nøgletekst.
  - Bruger indtaster bekræftelseskode fra app.
  - Kald `mfa.challenge` + `mfa.verify` for at bekræfte og aktivere faktoren.
- Hvis 2FA er aktiveret: knap "Deaktiver 2FA" med bekræftelsesdialog.
- Vis oplysning om, at gendannelseskoder ikke genereres, og at brugeren skal kontakte support ved mistet telefon.

## 4. Oversættelser
Tilføj nye nøgler på alle 7 sprog (da, en, sv, de, ar, no, es):
- `mfaTitle`, `mfaEnable`, `mfaDisable`, `mfaStatusEnabled`, `mfaStatusDisabled`
- `mfaScanQr`, `mfaEnterCode`, `mfaVerify`, `mfaSetupSuccess`, `mfaDisableConfirm`
- `mfaChallengeTitle`, `mfaChallengeDesc`, `mfaCodePlaceholder`, `mfaInvalidCode`
- `mfaNoRecoveryCodes`, `mfaLostPhoneHint`

## 5. Hjælp og changelog
- Opdater `src/pages/Help.tsx` med ny changelog-version (f.eks. v1.5.10) og beskrivelse af 2FA.
- Tilføj hjælpetrin om, hvordan man aktiverer 2FA under sikkerheds-/konto-emnet.
- Markér relevant emne med `isNew: true` og rød prik.

## 6. Test
- Test TOTP-opsætning for en almindelig bruger.
- Test login med og uden 2FA aktiveret.
- Test deaktivering af 2FA.
- Verificér oversættelser og RTL-layout for arabisk.

## Teknisk detalje
```text
Supabase MFA API:
- enroll:    supabase.auth.mfa.enroll({ factorType: 'totp' })
- challenge: supabase.auth.mfa.challenge({ factorId })
- verify:    supabase.auth.mfa.verify({ factorId, challengeId, code })
- unenroll:  supabase.auth.mfa.unenroll({ factorId })
- list:      supabase.auth.mfa.listFactors()
- aal:       supabase.auth.mfa.getAuthenticatorAssuranceLevel()
```

## Udestående afklaring
Skal vi gå i gang med at implementere frontend-flowet, mens vi afventer backend-aktivering — eller vil du først have mig til at undersøge, om Lovable Cloud kan slå MFA til på projektet?