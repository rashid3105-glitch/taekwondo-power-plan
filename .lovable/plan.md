# Chatnotifikationer: i appen, lyd og virkende web-push

Fire ting, som alle handler om at man opdager en ny besked.

## 1. Push virker ikke på web (bekræftet fejl)

Databasen viser 79 aktive push-enheder fra iOS/Android (med FCM-token) og 2 web-enheder,
der er gemt som browser-abonnementer (endpoint + nøgler) helt uden FCM-token.
`send-push` henter kun rækker hvor `fcm_token` ikke er tom — derfor får browsere aldrig noget.

Rettelse: `send-push` får en ekstra gren, der sender rigtige Web Push-beskeder til
browser-abonnementer (VAPID-signeret), parallelt med den eksisterende FCM-gren.
Døde abonnementer (svar 404/410) markeres `is_active = false`, præcis som i dag.
Dette kræver en hemmelighed med den private VAPID-nøgle, der matcher den offentlige
nøgle appen allerede bruger — jeg spørger efter den under implementeringen.

`public/push-sw.js` gennemgås, så klik på notifikationen åbner den rigtige samtale
(`/messages` med tråd-id), i stedet for kun `/dashboard`.

## 2. Notifikation inde i appen

Når appen er åben, er der i dag kun et lille tal på chat-knappen. Der tilføjes:

- En toast nederst/øverst: afsenderens navn + de første ord af beskeden.
- Klik på toasten åbner samtalen direkte.
- Toasten vises ikke, hvis du allerede står i den samme samtale.
- Én toast pr. besked, med kort sammenlægning hvis flere kommer på én gang.

## 3. Lyd og vibration

Kort, diskret lyd (og vibration på mobil) ved indgående besked, kun når vinduet er i brug.
Kan slås fra i indstillingerne (se punkt 4). Lyden afspilles kun efter brugerens første
klik i appen — browsere blokerer ellers automatisk afspilning.

## 4. Indstillinger

Under Profil ligger allerede "Push-beskeder". Der tilføjes to kontakter mere:

- Beskeder i appen (toast) — til/fra
- Lyd og vibration — til/fra

Gemmes pr. bruger, så det følger med på tværs af enheder. Alle tekster oversættes til
alle 7 sprog.

## Teknisk

- Ny fælles hook `useChatNotifications` (abonnerer på `chat_messages`-INSERT for mine
  tråde, filtrerer egne beskeder fra, styrer toast/lyd/vibration). Monteres ét sted
  globalt, så der kun findes én kanal — ikke én pr. komponent.
- `useThreads` genbruges til trådmedlemskab; ingen ekstra realtime-kanaler.
- Nye kolonner på `profiles`: `chat_toast_enabled boolean default true`,
  `chat_sound_enabled boolean default true` (migration + whitelist i
  `update-my-profile`).
- `send-push`: ny web-push-gren med VAPID-signering (Web Crypto), uændret kontrakt
  udadtil; `notify-chat-message` ændres kun til at sende `url: /messages?thread=<id>`.
- Lydfil lægges i `public/` og afspilles via en enkelt `Audio`-instans.
- Changelog og Help.tsx opdateres (v1.5.55).
