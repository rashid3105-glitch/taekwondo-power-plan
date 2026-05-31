## Mål
Atleten som videoen tilhører (`match_videos.athlete_id = auth.uid()`) får samme redigeringsrettigheder som coachen til **tags, noter og tegninger** på den video. Sletning af selve videoen forbliver coach-only. Klubkammerater og offentlige share-link-besøgende forbliver read-only.

## Ændringer

### 1. Database — udvid RLS-policies
Tilføj INSERT/UPDATE/DELETE policies så athlete-ejeren kan skrive:

- **`match_tags`** — ny policy "Athlete can manage tags on own videos" (ALL) hvor `match_videos.athlete_id = auth.uid()`.
- **`video_annotations`** (tegninger) — udvid "Coaches manage annotations": tillad også athlete-ejer at INSERT/UPDATE/DELETE rækker på egne videoer (via lookup i `match_videos.athlete_id`). `created_by` sættes stadig til `auth.uid()`.
- **`video_notes`** — eksisterende policy `auth.uid() = user_id` er allerede pr. bruger; ingen ændring nødvendig (hver bruger ser/redigerer sine egne noter). Tilføj dog en SELECT-policy så coach kan se athletes noter på egne match-videoer (collaborative review).

### 2. Frontend — `src/pages/MatchAnalysis.tsx`
Skift gating fra `isCoach && activeVideo.coach_id === me` til en bredere `canEdit`:
```ts
const canEdit = (isCoach && activeVideo.coach_id === me)
             || activeVideo.athlete_id === me;
```
Send `canEdit` videre som `isCoach`-prop til `VideoTagger` (alternativt omdøb propen til `canEdit` for klarhed).

### 3. Frontend — `src/components/match/VideoTagger.tsx`
- Omdøb `isCoach` prop til `canEdit` (intern brug) men bevar den nuværende edit-UI.
- **Skjul stadig coach-only handlinger** der ikke skal være athlete-tilgængelige:
  - Slet video-knap → kun hvis `video.coach_id === me` (faktisk coach-ejer).
  - Del/revoke share-link → kun coach-ejer.
- Alle andre kontroller (tilføj tag, rediger tag, slet eget tag, tegne-værktøj, scrubber-noter) bliver synlige for `canEdit`.

### 4. `VideoNotes.tsx` / `VideoScrubber.tsx`
Ingen ændringer — de bruger allerede `auth.uid()` til at gemme noter/annoteringer.

## Out of scope
- Public share-link viewers forbliver read-only (`MatchShare.tsx` rører vi ikke).
- Klubkammerater (andre atleter i samme klub) får ikke redigeringsret.
- Sletning af videoer og share-token-håndtering forbliver coach-only.

## Tekniske noter
- Migration kører kun policy-tilføjelser; ingen schema-ændringer.
- Bagudkompatibelt: coach-flow er uændret.
