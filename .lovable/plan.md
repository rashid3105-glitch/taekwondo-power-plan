# Diagnose: profilbilleder vises ikke i native iOS-app

Ingen kodeændringer foretaget. Nedenfor er fundene.

## 1. Hvem renderer avataren?

- Header (I dag): `src/pages/Dashboard.tsx:821-826` — `<AvatarImg avatarUrl={profile?.avatar_url} ... />`
- Hilsen ("Greeting line"), samme side: `src/pages/Dashboard.tsx:985-990`
- Liste-kort: `src/pages/Dashboard.tsx:1288-1289`
- Komponent: `src/components/AvatarImg.tsx` (hele filen), som bruger hook `src/hooks/useAvatarUrl.ts`
- Profilsider bruger hooken direkte: `src/pages/Profile.tsx:103`, `src/pages/ProfileSetup.tsx:71`, `src/pages/ProfileEdit.tsx:52`
- Chat: `src/components/chat/Conversation.tsx:51` (signeret via hook), men `Conversation.tsx:219` sender rå `avatar_url` videre til `MessageBubble.tsx:135`, hvor den sættes direkte som `src` — dét er et reelt hul (usigneret URL mod privat bucket).

## 2. Hvordan bygges URL'en?

`src/hooks/useAvatarUrl.ts:52-60`:

```ts
void supabase.storage
  .from("avatars")
  .createSignedUrl(path, TTL_SECONDS)   // TTL_SECONDS = 3600
```

Altså signed URL, ikke `getPublicUrl`, ikke download+blob. Klublogoet bruger derimod `getPublicUrl` mod en public bucket (`src/components/admin/ClubBrandingSection.tsx:82`) — derfor virker logoet altid.

## 3. Håndteres begge formater i avatar_url?

Ja. `src/hooks/useAvatarUrl.ts:8-20` normaliserer både absolutte URL'er (`/object/public/avatars/`, `/object/sign/avatars/`) og relative stier, og stripper `?t=`-suffiks. De 3 rækker med absolut URL og de 11 med relativ sti bliver derfor alle til korrekt objekt-sti. Formatblandingen er altså ikke årsagen.

## 4. Signed URLs + Capacitor-forhold

- Signeres ved første render pr. sti, caches in-memory i 59 min (`cache`, `TTL_SECONDS - 60`).
- `createSignedUrl` er et autentificeret POST-kald: uden gyldig session eller uden SELECT-policy på `storage.objects` for `avatars` fejler det → hooken returnerer `null` → `AvatarImg` viser placeholder-ikonet (User-ikon), **ikke** et brudt billede.
- Det er den afgørende detalje: den nuværende kode kan ikke producere et "brudt billede"-ikon i den første render — den viser fallback. Et brudt billede opstår kun, hvis en `<img src>` peger på en usigneret `/object/public/avatars/...` URL.

## Mest sandsynlige årsag

Den installerede iOS-app kører en **ældre webbundle** end web-appen. Capacitor er konfigureret uden `server.url` (`capacitor.config.ts` — `webDir: 'dist'`), så iOS serverer de assets, der lå i bundlen ved sidste `npm run build && npx cap sync ios`. Den bundle er fra før `avatars` blev gjort privat og satte `avatar_url` direkte som `src` (public-URL) → HTTP 400/404 → brudt billede-ikon. Web-appen henter derimod ny kode ved hver load og bruger signed URLs. Klublogoet påvirkes ikke, fordi dets bucket stadig er public.

Sekundær (reel, men mindre sandsynlig som forklaring på headeren): `MessageBubble.tsx:135` bruger stadig rå `avatar_url` som `src` — brudte avatarer i chatten både på web og iOS.

Bemærk også: service worker cacher billeder StaleWhileRevalidate (`vite.config.ts:65-76`), så tidligere fejlsvar for avatar-URL'er kan blive genbrugt et stykke tid efter en opdatering.

## Foreslåede næste skridt (ikke udført)

1. Byg og synk iOS-appen på ny (`npm run build && npx cap sync ios`) og verificér, at brudte billeder forsvinder.
2. Ret `MessageBubble` til at signere afsender-avataren via `useAvatarUrl`.
3. Overvej at ekskludere Supabase storage-URL'er fra image-runtime-caching, så udløbne/fejlende signerede svar ikke caches.
