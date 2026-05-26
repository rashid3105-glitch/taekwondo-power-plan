## Problem
1. Videoafspilleren bruger en fast højde `h-[400px]` med `object-contain`, så portræt-/kvadratiske klip får store sorte bjælker og landskabsklip vises forvrænget/uoptimalt (det er det, der ses på skærmbilledet).
2. Der findes ingen knapper til at ændre afspilningshastighed.

Berørte filer:
- `src/components/match/VideoTagger.tsx` (coach + athlete view)
- `src/pages/MatchShare.tsx` (offentlig share-side)

## Løsning

### 1. Tilpas afspilleren til videoens format
- Fjern fast `h-[400px]`.
- Indfang `videoWidth`/`videoHeight` i `onLoadedMetadata` og sæt `aspectRatio` inline på `<video>` (fallback `16/9` indtil metadata er hentet).
- Begræns højden så den ikke fylder hele skærmen på desktop: `max-h-[70vh]` + `w-full`, beholder `object-contain` og sort baggrund som sikker fallback.
- Samme behandling i `MatchShare.tsx`.

### 2. Hastighedskontrol (0.25× / 0.5× / 1× / 1.5× / 2×)
- Lille toolbar lige under videoen i både `VideoTagger` og `MatchShare`:
  - Label `t("matchPlaybackSpeed")` ("Hastighed" / "Speed" osv.)
  - 5 små `Button variant="outline" size="sm"`-knapper; aktiv hastighed får `variant="default"`.
  - Klik sætter `videoRef.current.playbackRate = rate` og opdaterer lokal `speed` state.
- Behold valgt hastighed når kilde-URL'en re-loades (sæt `playbackRate` igen i `onLoadedMetadata`).
- Tilføj 2 oversættelsesnøgler (`matchPlaybackSpeed`, `matchSpeedNormal`) til alle 7 sprog i `src/i18n/translations.ts`. Tal-labels (0.25× osv.) er sprogneutrale og hardcodes som strings.

## Out of scope
- Ingen ændringer i tagging-logik, share-flow eller datamodel.
- Ingen ny ikonografi / design-redesign — kun layout-fix + lille toolbar med eksisterende `Button`-komponent og semantiske tokens.
