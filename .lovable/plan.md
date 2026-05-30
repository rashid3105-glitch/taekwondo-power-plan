# Plan

Jeg retter de to konkrete fejl uden at udvide scope.

## 1. Ret ernæringsfejlen der stadig siger alder/vægt mangler
- Opdatere `src/pages/Library.tsx`, så profilopslaget bruger den rigtige nøgle (`user_id`) i stedet for `id`.
- Beholde fallback-logikken for alder ud fra `birth_date`, så ernæringsplanen virker, selv hvis `age`-kolonnen ikke er udfyldt.
- Verificere at `NutritionPlan` dermed modtager reel profil-data og ikke falder tilbage til fejltost.

## 2. Ret profilbillede der ikke gemmer
- Gennemgå og justere `src/pages/ProfileSetup.tsx`, så avatar-flowet ikke kun viser lokal preview, men også ender i et vedvarende gemt `avatar_url`-felt efter save.
- Sikre at gem-flowet håndterer samme robusthed som det eksisterende `ProfileEdit`-flow: korrekt path, korrekt persistens via `update-my-profile`, og tydelig state-opdatering efter succes.
- Kontrollere om problemet er, at billedet uploades men ikke verificeres/persistes, eller at det gemmes men UI ikke loader den gemte værdi korrekt efter navigation.

## 3. Hurtig validering efter rettelser
- Bekræfte at ernæringsknappen ikke længere stopper på “Udfyld din profil …”, når profil har fødselsdato og vægt.
- Bekræfte at profilbilledet stadig vises efter save/reload og ikke kun som midlertidig preview.

## Tekniske detaljer
- Berørte filer forventes primært at være:
  - `src/pages/Library.tsx`
  - `src/pages/ProfileSetup.tsx`
- Jeg ændrer ikke backend-schema eller andre features, medmindre en lille eksisterende flow-justering er nødvendig for at få gemning til at fungere korrekt.