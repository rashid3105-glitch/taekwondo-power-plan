## Problem
På `/diary` (Dagbog) er brødtekst og løbe-metrics næsten usynlige (hvid tekst på lys grå-hvid kortbaggrund). Det rammer både atlet og coach (coachen ser samme side når han åbner en atlets dagbog).

## Årsag
`ThemeSync` (src/contexts/ThemeSync.tsx) overskriver globalt:
- `--background: 0 0% 4%` (sort)
- `--foreground: 0 0% 100%` (hvid)

…men rører IKKE `--card` / `--card-foreground`. Så kortene beholder lys-tema-værdierne (`--card: 220 13% 95%` lys, `--card-foreground: 222 35% 12%` mørk).

I `src/pages/Diary.tsx` bruges `text-foreground` (= hvid) til indholdsteksten inde i `bg-card` (= lys). Resultat: hvid på næsten-hvid → usynlig. Det samme gælder umarkerede `<div>`'er (fx "5 km", "5:00/km") som arver body-color = hvid.

Bemærk: `CoachDiaryView` bruger allerede `text-card-foreground` korrekt og er ikke berørt.

## Fix (kun src/pages/Diary.tsx — frontend-only, kun farveklasser)

1. Linje 706 (compact-række — entry.content):
   `text-sm text-foreground` → `text-sm text-card-foreground`

2. Linje 759 (expanded entry.content):
   `text-sm text-foreground whitespace-pre-wrap leading-relaxed` → `text-sm text-card-foreground whitespace-pre-wrap leading-relaxed`

3. Linje 763 (løbe-distance tal):
   `text-sm font-bold` → `text-sm font-bold text-card-foreground`

4. Linje 768 (løbe-pace tal):
   `text-sm font-bold` → `text-sm font-bold text-card-foreground`

(Kcal-tallet på linje 774 har allerede `text-emerald-600` og er synligt.)

## Ikke berørt
- Ingen ændring i ThemeSync, index.css eller andre temaer.
- Ingen ændring i CoachDiaryView (allerede korrekt).
- Ingen logik/data/RLS/edge functions.

## Verifikation
Efter ændringen skal teksten i hver dagbogspost ("Det var en rigtig god træning i dag", "great", "good") og metrics ("5 km", "5:00/km") være tydeligt mørke på den lyse korthandflade — både når man er logget ind som atlet og når en coach åbner samme side.
