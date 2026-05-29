# Plan for stabil profilbillede-upload

## Mål
Lave en samlet, robust løsning så profilbilleder både:
- uploades korrekt
- gemmes korrekt på profilen
- vises korrekt på alle relevante sider
- overlever refresh, navigation og cache

## Arbejde jeg vil udføre

### 1. Samle avatar-strategien til én konsistent model
- Gennemgå og rette mismatch mellem nuværende public/private bucket-logik.
- Vælge én entydig lagringsform for `profiles.avatar_url` og bruge den samme overalt.
- Fjerne forskelle mellem `ProfileEdit`, `ProfileSetup`, `useAvatarUrl`, `AvatarImg`, `Profile` og andre avatar-forbrugere.

### 2. Gøre save-flowet robust i `ProfileEdit`
- Skille upload, profil-opdatering og øvrig profilgemning tydeligt ad.
- Sikre at avatar-upload kun markeres som succes, når både storage og `profiles.avatar_url` faktisk er opdateret.
- Tilføje klar fejlhåndtering for hver fase, så en skjult DB/RLS-fejl ikke ender som falsk “Profil gemt”.
- Bevare nuværende øvrige profilgemning uden at bryde coach/licensfelter.

### 3. Validere og rette backend-reglerne
- Gennemgå eksisterende storage policies for `avatars` og rette manglende eller modstridende regler.
- Gennemgå om `profiles`-updatepolitikken reelt tillader brugerens egen opdatering af `avatar_url`.
- Tilføje migration kun hvor det er nødvendigt for en stabil løsning.

### 4. Ensrette visning af avatar på tværs af appen
- Sørge for at profilside, dashboard, coach-visninger og fælles avatar-komponent bruger samme URL-opløsning.
- Fjerne nuværende inkonsistens hvor nogle steder viser rå sti, andre public URL, og andre signeret/public logik.
- Sikre cache-busting efter upload, så nyt billede vises med det samme.

### 5. Verificere end-to-end
- Teste flowet: vælg billede → gem → refresh → gå til andre sider → bekræft at billedet stadig vises.
- Kontrollere at der ikke længere kommer “success” når `avatar_url` stadig er `null`.
- Kontrollere at eksisterende brugere med gamle avatar-formater stadig vises korrekt.

## Tekniske detaljer
- Fokusfiler bliver primært:
  - `src/pages/ProfileEdit.tsx`
  - `src/pages/ProfileSetup.tsx`
  - `src/hooks/useAvatarUrl.ts`
  - `src/components/AvatarImg.tsx`
  - relevante migrations under `supabase/migrations`
- Jeg forventer også at verificere avatar-forbrug i:
  - `src/pages/Profile.tsx`
  - evt. offentlige/coach-relaterede avatarvisninger

## Forventet resultat
Efter ændringen skal profilbillede-upload virke stabilt for både nye uploads og eksisterende profiler, uden falske succesbeskeder og uden forskellig opførsel mellem sider.