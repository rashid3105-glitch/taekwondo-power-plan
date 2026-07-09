## Diagnose

Symptom (TestFlight iOS): Efter tryk på en samtale bliver hele skærmen uklikbar — kun app-genstart hjælper. Screenshottet viser at hele siden er dæmpet (ikke bare uklikbar), hvilket peger på at der ligger et usynligt/næsten-usynligt fixed lag over hele viewporten, ELLER at `document.body` har fået `pointer-events: none` sat af Radix og aldrig får det fjernet.

Der er ingen synlig Sheet/Dialog i selve `/messages`-flowet efter det tidligere fix, men Radix' Dialog/Sheet primitives (som bruges globalt af `GlobalAppMenu`, `NewGroupDialog`, `StartChatPicker`, `AddMembersDialog`, `AlertDialog` i `MessageBubble`) har en velkendt fejl på iOS WKWebView / Capacitor:

- Ved close-animation efterlades `<body style="pointer-events: none">` (Radix' scroll-lock).
- Hvis komponenten unmountes midt i close (fx fordi vi swapper `<ThreadList>` ud med `<Conversation>` i samme parent), kører cleanup ikke — og body forbliver blokeret indtil app-genstart.

Sekundært: `Conversation`-containeren er `relative`, mens `membersOpen`-overlayet er `absolute inset-0 z-20`. Selv når `membersOpen=false` kan iOS pege-events fanges hvis containerens højde kollapser i WebView (kendt bug med `flex-1 min-h-0` inde i `100dvh` under Capacitor keyboard-resize).

## Fix

### 1) Global "pointer-events unlock" for `<body>` ved route-skift og efter enhver Radix Dialog close
Ny hjælpekomponent `BodyPointerEventsGuard` mountet én gang i `App.tsx`. Den:
- Lytter på `MutationObserver` på `document.body` for `style`-ændringer og fjerner `pointer-events: none` hvis der ikke længere findes et åbent `[data-state="open"][role="dialog"]` i DOM'et.
- Rydder også `body.style.pointerEvents` ved hver route-transition (via `useLocation`).

Dette er defensivt og fikser problemet uanset hvilken Dialog/Sheet der er "boblen".

### 2) Undgå at unmounte Conversation midt i en Dialog-cleanup
I `Messages.tsx` sikrer vi at `AlertDialog`, `AddMembersDialog` osv. lukkes rent inden vi swapper:
- Sæt `active` via `startTransition(() => setActive(t))` så React ikke commit'er unmount imens Radix' close-animation kører.
- Ved `onBack` fra Conversation: nulstil eksplicit `document.body.style.pointerEvents = ""` som ekstra sikring før state-swap.

### 3) `Conversation.tsx`
- Tilføj `touch-action: manipulation` og `pointer-events: auto` på wrapper-div'en så evt. arvet `pointer-events: none` fra en forælder ikke slår ned på selve chatten.
- Marker den absolutte `membersOpen`-overlay med `pointer-events: none` når `membersOpen=false` (den renderes ikke i den branch, men vi tilføjer defensiv `hidden`-guard).

### 4) Diagnostik (midlertidig, men i produktion)
Log én gang ved mount af `Messages` og ved tryk på thread:
```ts
console.info("[chat] body PE:", document.body.style.pointerEvents,
  "openDialogs:", document.querySelectorAll('[data-state="open"][role="dialog"]').length);
```
Så vi ved næste TestFlight-tur straks kan se om `BodyPointerEventsGuard` faktisk fanger sagen, eller om der er en helt anden overlay-kilde.

## Filer der ændres
- `src/components/BodyPointerEventsGuard.tsx` — ny, global vagt.
- `src/App.tsx` — mount `<BodyPointerEventsGuard />` inde i `<BrowserRouter>`.
- `src/pages/Messages.tsx` — brug `startTransition` ved `setActive`, ryd body PE ved `onBack`, tilføj diagnostik-log.
- `src/components/chat/Conversation.tsx` — `pointer-events-auto touch-manipulation` på wrapper.

## Verifikation
1. Byg web-preview, åbn `/messages`, tryk på en samtale → åbn devtools og bekræft `document.body.style.pointerEvents === ""`.
2. Åbn/luk `GlobalAppMenu` (hamburger), `Ny gruppe`-dialog og slette-dialog i en besked; verificér i konsollen at body aldrig efterlades låst.
3. Efter deploy: `npx cap sync ios` + ny TestFlight-build; bekræft at chatten forbliver klikbar efter at have åbnet en samtale.

## Hvis det stadig sker efter fix
Diagnostik-loggen vil vise præcis hvilken overlay der er tilbage. Så kan vi målrette den enkelte Dialog i stedet for at gætte videre.