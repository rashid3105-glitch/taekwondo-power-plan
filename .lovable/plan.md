## Problem
På Android (både web sportstalent.dk og native app) — når man trykker på en samtale i `/messages`, kommer der et mørkt overlay som blokerer alt. Ingen chat vises. Kun `Ny samtale`/`Ny gruppe`-knapperne skinner igennem.

Screenshot og trigger ("efter tryk på en samtale") peger på at Radix `Sheet` (bottom) i `src/pages/Messages.tsx` åbnes, men `SheetContent`/`Conversation` render'er ikke synligt — overlay'et bliver siddende.

## Sandsynlige årsager (skal verificeres)
1. `<Conversation>` throw'er under render inde i Sheet'en (fx `useMessages`/`useAvatarUrl`/`markThreadRead`), så React unmount'er content men Radix' overlay bliver hængende.
2. `h-[100dvh]` + `pt-safe-min pb-safe` på `SheetContent` giver 0-højde på Android WebView → content usynligt, overlay dækker.
3. Sheet + parallel desktop-grid: `<div className="grid md:grid-cols-[320px_1fr] ...">` render'er også `<Conversation>` i højre kolonne på desktop-siden — hvis mobile-flow'et sætter `active` og desktop-grid ALTID vises (ingen `md:` klasse skjuler den på mobile), kan der ske dobbelt-mount/side-effekt.

## Plan

### 1. Reproducer & diagnosticér
- Kør Playwright mod localhost `/messages` med mobile viewport (384x644, dpr 2.8), log ind som eksisterende bruger, tap en tråd, tag screenshot + DOM-snap af `[data-radix-portal]` for at se om `SheetContent` faktisk er der.
- Åbn console og network log og fang eventuelle runtime errors i `Conversation` / `useMessages` / `useAvatarUrl` / `markThreadRead`.

### 2. Fix afhængigt af hvad diagnosen viser
- **Hvis render throw'er:** wrap `Conversation` i ErrorBoundary og fix den konkrete fejl (typisk manglende `thread.members` guards eller `useAvatarUrl` for null).
- **Hvis 0-højde:** skift `h-[100dvh]` til `h-dvh` med fallback `min-h-screen`, eller drop `pt-safe-min pb-safe` på selve `SheetContent` og læg safe-area padding indenfor.
- **Hvis dobbelt-render:** skjul desktop-panel på mobile (`hidden md:grid` på grid-wrapperen) så mobile kun har én Conversation-instans (den i Sheet'en).

### 3. Verificer
- Playwright: åbn tråd, screenshot skal vise chat-headeren "← Sami Malik Rashid" og composer, ingen mørkt overlay uden indhold.
- Bekræft samme fix virker for både `/messages`-siden og `ChatDrawer` (floating chat på Dashboard) som bruger samme `Conversation`-komponent.

### 4. Deploy-note til brugeren
Fixet skal:
- Republish'es for at ramme `sportstalent.dk`.
- Køre `npm run build && npx cap sync android` + rebuild i Android Studio for at ramme native app.

## Filer der forventes berørt
- `src/pages/Messages.tsx` (grid-visibility / Sheet height)
- `src/components/chat/Conversation.tsx` (guards + evt. ErrorBoundary)
- evt. `src/components/ui/sheet.tsx` (kun hvis vi rører base-styling)
