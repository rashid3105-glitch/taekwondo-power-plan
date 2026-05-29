## Mål
Tilføj en sjette fane "Video" til atlet-bundnavigationen, der linker til `/match-analysis/me`.

## Ændringer

**Fil:** `src/pages/Dashboard.tsx` (linje 760-765)

Tilføj ny entry i atlet-arrayet for bundnavigationen mellem "Dagbog" og "Chat":

```ts
{ key: "video", label: t("hubMatchTitle") || "Video", icon: VideoIcon, active: false, onClick: () => navigate("/match-analysis/me") },
```

- Icon: `Video` fra lucide-react (alias `VideoIcon` — allerede importeret i filen, ellers tilføj import)
- Label: bruger eksisterende oversættelsesnøgle `hubMatchTitle` (findes på alle 7 sprog)
- Kun atletens egen video-side `/match-analysis/me`

## Layout-justering
Med 6 faner på smalle skærme bliver hver fane ~16% bred. Den eksisterende styling (`flex-1 min-w-0`, `text-[9px]`, `truncate`) håndterer det allerede — labels forkortes automatisk. Ingen yderligere CSS-ændringer nødvendige.

## Ikke i scope
- Coach-baren ændres ikke
- Ingen ændring af eksisterende hub-tiles eller modul-chips
- Ingen nye oversættelsesnøgler
