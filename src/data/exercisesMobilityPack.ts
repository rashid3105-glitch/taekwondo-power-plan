// Mobility pack — morning-reset style mobility & stability drills.
// Same shape as exercisesExpansion.ts. EN/DA/SV/NO authored; DE+AR fall back to EN.

import type { ExerciseCategory, MuscleGroup } from "./exercises";

interface L {
  name: string;
  notes: string;
  whyItMatters: string;
  alternatives?: { name: string; reason: string }[];
}

interface Base {
  id: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets: number;
  reps: string;
  tempo?: string;
  rest: string;
  videoId: string;
  en: L; da: L; sv: L; de: L; ar: L; no: L;
}

const E = (
  meta: Omit<Base, "en" | "da" | "sv" | "de" | "ar" | "no">,
  en: L, da: L, sv: L, no: L,
): Base => ({ ...meta, en, da, sv, no, de: en, ar: en });

export const exercisesMobilityPack: Record<string, Base> = {
  chairToToeStand: E(
    { id: "chair-to-toe-stand", category: "mobility", muscleGroups: ["calves", "quads", "glutes"], sets: 2, reps: "12-15", tempo: "Slow & controlled", rest: "30 sec", videoId: "" },
    {
      name: "Chair to Toe Stand",
      notes: "Start in a deep chair-squat with hands clasped at the chest. Stand up tall and continue onto the balls of your feet, pause 1 sec, then lower under control. Keep the knees tracking over the toes.",
      whyItMatters: "Improves balance and calf strength through the full range from deep squat to full plantar flexion — the exact chain used to push off and rise onto the ball of the foot before a kick.",
      alternatives: [{ name: "Bodyweight Squat + Calf Raise", reason: "Split the movement in two if balance is the limiter" }],
    },
    {
      name: "Stol til Tåstand",
      notes: "Start i en dyb stolesquat med hænderne samlet foran brystet. Rejs dig helt op og fortsæt op på fodballerne, hold 1 sek., og sænk kontrolleret. Knæene følger tæernes retning.",
      whyItMatters: "Forbedrer balance og lægstyrke gennem hele banen fra dyb squat til fuld tåstand — præcis den kæde du bruger til at skubbe fra og komme op på fodballen før et spark.",
      alternatives: [{ name: "Kropsvægt-squat + Tåhævning", reason: "Del øvelsen i to, hvis balancen er begrænsningen" }],
    },
    {
      name: "Stol till Tåstående",
      notes: "Börja i en djup stolsknäböj med händerna samlade framför bröstet. Res dig helt upp och fortsätt upp på trampdynorna, håll 1 sek och sänk kontrollerat. Knäna följer tårnas riktning.",
      whyItMatters: "Förbättrar balans och vadstyrka genom hela rörelsebanan från djup knäböj till full tåstående — samma kedja som används för att trycka ifrån inför en spark.",
      alternatives: [{ name: "Kroppsviktsknäböj + Vadpress", reason: "Dela upp rörelsen om balansen är begränsningen" }],
    },
    {
      name: "Stol til Tåstand",
      notes: "Start i en dyp stolknebøy med hendene samlet foran brystet. Reis deg helt opp og fortsett opp på fotballene, hold 1 sek, og senk kontrollert. Knærne følger tærnes retning.",
      whyItMatters: "Forbedrer balanse og leggstyrke gjennom hele banen fra dyp knebøy til full tåstand — nøyaktig kjeden du bruker til å skyve fra før et spark.",
      alternatives: [{ name: "Kroppsvekt-knebøy + Tåhev", reason: "Del øvelsen i to hvis balansen er begrensningen" }],
    },
  ),

  tSpineOpener: E(
    { id: "t-spine-opener", category: "mobility", muscleGroups: ["back", "shoulders", "core"], sets: 2, reps: "8-10 each side", tempo: "2 sec hold at end range", rest: "30 sec", videoId: "" },
    {
      name: "T-Spine Opener",
      notes: "On all fours, sit the hips back toward the heels. One hand behind the head, rotate the elbow down under the body, then open it up toward the ceiling. Exhale at the top. Hips stay still.",
      whyItMatters: "Improves thoracic mobility so rotation comes from the upper back instead of the lower back — the base for spinning kicks, clean guard position and pain-free overhead work.",
      alternatives: [{ name: "Open Book Stretch", reason: "Side-lying version with the same rotation demand" }],
    },
    {
      name: "T-Spine Åbner",
      notes: "Stå på alle fire og sæt hoften tilbage mod hælene. Én hånd bag hovedet, rotér albuen ned under kroppen og åbn den derefter op mod loftet. Ånd ud i toppen. Hoften står stille.",
      whyItMatters: "Forbedrer thorakal mobilitet, så rotationen kommer fra øvre ryg i stedet for lænden — fundamentet for spinspark, ren gardposition og smertefrit arbejde over hovedet.",
      alternatives: [{ name: "Open Book Stræk", reason: "Sideliggende version med samme rotationskrav" }],
    },
    {
      name: "T-Spine Öppnare",
      notes: "Stå på alla fyra och sätt höften bakåt mot hälarna. En hand bakom huvudet, rotera armbågen ner under kroppen och öppna sedan upp mot taket. Andas ut i toppen. Höfterna står still.",
      whyItMatters: "Förbättrar bröstryggsmobilitet så att rotationen kommer från övre ryggen i stället för ländryggen — grunden för snurrsparkar och smärtfritt arbete över huvudet.",
      alternatives: [{ name: "Open Book Stretch", reason: "Sidliggande version med samma rotationskrav" }],
    },
    {
      name: "T-Spine Åpner",
      notes: "Stå på alle fire og sett hoften bakover mot hælene. Én hånd bak hodet, roter albuen ned under kroppen og åpne den deretter opp mot taket. Pust ut i toppen. Hoftene står stille.",
      whyItMatters: "Forbedrer torakal mobilitet slik at rotasjonen kommer fra øvre rygg i stedet for korsryggen — grunnlaget for spinnspark og smertefritt arbeid over hodet.",
      alternatives: [{ name: "Open Book Strekk", reason: "Sideliggende versjon med samme rotasjonskrav" }],
    },
  ),

  knee9090Stand: E(
    { id: "90-90-knee-stand", category: "mobility", muscleGroups: ["glutes", "hip-flexors", "core"], sets: 2, reps: "8-10 each side", tempo: "Controlled, no hands", rest: "45 sec", videoId: "" },
    {
      name: "90/90 Knee Stand",
      notes: "Sit in the 90/90 position with front and back leg both at 90°. Without using your hands, drive through the hips up to a tall kneeling position, squeeze the glutes, then lower back down with control.",
      whyItMatters: "Builds hip strength and mobility in the same drill — you own the end range of internal and external hip rotation instead of just stretching into it.",
      alternatives: [{ name: "90/90 Hip Switch", reason: "Mobility only, if standing up is still too hard" }],
    },
    {
      name: "90/90 Knæstand",
      notes: "Sid i 90/90-position med både forreste og bagerste ben i 90°. Uden at bruge hænderne presser du op gennem hoften til høj knæstand, spænder ballerne og sænker kontrolleret ned igen.",
      whyItMatters: "Opbygger hoftestyrke og mobilitet i samme øvelse — du ejer yderomfanget af indre og ydre hofterotation i stedet for kun at strække ind i det.",
      alternatives: [{ name: "90/90 Hofteskift", reason: "Kun mobilitet, hvis opstigningen stadig er for svær" }],
    },
    {
      name: "90/90 Knästående",
      notes: "Sitt i 90/90-position med både främre och bakre ben i 90°. Utan att använda händerna, pressa upp genom höften till högt knästående, spänn sätet och sänk kontrollerat ner igen.",
      whyItMatters: "Bygger höftstyrka och mobilitet i samma övning — du äger ytterläget av inre och yttre höftrotation i stället för att bara stretcha in i det.",
      alternatives: [{ name: "90/90 Höftväxling", reason: "Endast mobilitet om uppresningen är för svår" }],
    },
    {
      name: "90/90 Knestand",
      notes: "Sitt i 90/90-posisjon med både fremre og bakre ben i 90°. Uten å bruke hendene presser du opp gjennom hoften til høy knestand, spenner setet og senker kontrollert ned igjen.",
      whyItMatters: "Bygger hoftestyrke og mobilitet i samme øvelse — du eier ytterstillingen av indre og ytre hofterotasjon i stedet for bare å strekke inn i den.",
      alternatives: [{ name: "90/90 Hofteveksling", reason: "Kun mobilitet hvis oppreisningen er for tung" }],
    },
  ),

  bridgeMarching: E(
    { id: "bridge-marching", category: "strength", muscleGroups: ["glutes", "hamstrings", "core"], sets: 3, reps: "10-12 each side", tempo: "2 sec per lift", rest: "45 sec", videoId: "" },
    {
      name: "Bridge Marching",
      notes: "Lie on your back, feet planted, and press into a glute bridge. Hold the hips level while you lift one knee toward the chest, place it back down, then switch. No hip drop or rotation.",
      whyItMatters: "Builds glute stability on one leg while the pelvis stays square — the control that keeps the standing leg solid every time you kick.",
      alternatives: [{ name: "Single-Leg Glute Bridge", reason: "Static hold version if the pelvis drops during the march" }],
    },
    {
      name: "Bromarch",
      notes: "Lig på ryggen med fødderne plantet og pres op i en glute bridge. Hold hoften i vater mens du løfter det ene knæ mod brystet, sætter det ned igen og skifter. Ingen sænkning eller rotation i hoften.",
      whyItMatters: "Opbygger ballestabilitet på ét ben, mens bækkenet holdes i vater — den kontrol der holder standbenet stabilt, hver gang du sparker.",
      alternatives: [{ name: "Etbens Glute Bridge", reason: "Statisk version, hvis bækkenet falder under marchen" }],
    },
    {
      name: "Bromarsch",
      notes: "Ligg på rygg med fötterna planterade och pressa upp i en glute bridge. Håll höften i våg medan du lyfter ena knät mot bröstet, sätter ner det och byter. Ingen höftsänkning eller rotation.",
      whyItMatters: "Bygger sätesstabilitet på ett ben medan bäckenet hålls rakt — kontrollen som håller stödbenet stabilt varje gång du sparkar.",
      alternatives: [{ name: "Enbens Glute Bridge", reason: "Statisk version om bäckenet sjunker under marschen" }],
    },
    {
      name: "Bromarsj",
      notes: "Ligg på ryggen med føttene plantet og press opp i en glute bridge. Hold hoften i vater mens du løfter det ene kneet mot brystet, setter det ned igjen og bytter. Ingen senkning eller rotasjon i hoften.",
      whyItMatters: "Bygger setestabilitet på ett ben mens bekkenet holdes rett — kontrollen som holder standbeinet stabilt hver gang du sparker.",
      alternatives: [{ name: "Ettbens Glute Bridge", reason: "Statisk versjon hvis bekkenet faller under marsjen" }],
    },
  ),
};
