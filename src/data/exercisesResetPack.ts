// Reset pack — "6 moves to reset your body" mobility flow.
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

export const exercisesResetPack: Record<string, Base> = {
  plankToFrogSquat: E(
    { id: "plank-to-frog-squat", category: "mobility", muscleGroups: ["hip-flexors", "glutes", "hamstrings", "core"], sets: 2, reps: "8-10", tempo: "2 sec in the deep position", rest: "30 sec", videoId: "" },
    {
      name: "Plank to Frog Squat",
      notes: "Start in a high plank. Walk or hop both feet up outside the hands into a deep frog squat, let the hips sink and the chest stay tall for 2 sec, then step back to plank. Heels stay down if possible.",
      whyItMatters: "Opens the hips and ankles in the deep squat position while the core keeps working — the range you need for low stances, level changes and deep kicking chamber.",
      alternatives: [{ name: "Deep Squat Hold", reason: "Static version if stepping in is too demanding" }],
    },
    {
      name: "Planke til Frøsquat",
      notes: "Start i høj planke. Gå eller hop begge fødder op uden om hænderne til en dyb frøsquat, lad hoften synke og hold brystet højt i 2 sek., og træd tilbage til planke. Hælene bliver nede, hvis muligt.",
      whyItMatters: "Åbner hofter og ankler i den dybe squat-position, mens core arbejder — det bevægeudslag du skal bruge til lave stande, niveauskift og dyb sparkeoptræk.",
      alternatives: [{ name: "Dyb Squat Hold", reason: "Statisk version, hvis indtrinnet er for hårdt" }],
    },
    {
      name: "Planka till Grodknäböj",
      notes: "Börja i hög planka. Gå eller hoppa upp båda fötterna utanför händerna till en djup grodknäböj, låt höften sjunka och håll bröstet högt i 2 sek, kliv sedan tillbaka till planka. Hälarna kvar i golvet om möjligt.",
      whyItMatters: "Öppnar höfter och fotleder i djup knäböjsposition medan bålen arbetar — rörligheten du behöver för låga ställningar och djupt sparkupptag.",
      alternatives: [{ name: "Djup Knäböj Håll", reason: "Statisk version om insteget är för tungt" }],
    },
    {
      name: "Planke til Froskknebøy",
      notes: "Start i høy planke. Gå eller hopp begge føttene opp utenfor hendene til en dyp froskknebøy, la hoften synke og hold brystet høyt i 2 sek, og gå tilbake til planke. Hælene blir nede om mulig.",
      whyItMatters: "Åpner hofter og ankler i dyp knebøyposisjon mens kjernen jobber — bevegeligheten du trenger til lave stillinger og dypt sparkopptrekk.",
      alternatives: [{ name: "Dyp Knebøy Hold", reason: "Statisk versjon hvis innsteget er for tungt" }],
    },
  ),

  kneelingKneeTapCrossReach: E(
    { id: "kneeling-knee-tap-cross-reach", category: "mobility", muscleGroups: ["core", "back", "shoulders", "hip-flexors"], sets: 2, reps: "8-10 each side", tempo: "Slow, no rushing", rest: "30 sec", videoId: "" },
    {
      name: "Kneeling Knee Tap to Cross Reach",
      notes: "On all fours with the knees hovering just above the floor. Tap one knee lightly down, then reach the same-side arm across and under the body, and finish by opening up into a tall diagonal reach. Alternate sides.",
      whyItMatters: "Trains rotation and anti-rotation in the same rep — the trunk control that transfers force from the floor into every kick and punch.",
      alternatives: [{ name: "Bird Dog", reason: "Simpler version with the same anti-rotation demand" }],
    },
    {
      name: "Knæstand med Knætap og Krydsstræk",
      notes: "Stå på alle fire med knæene svævende lige over gulvet. Tap det ene knæ let ned, før derefter samme sides arm ind under kroppen og åbn til sidst op i et højt diagonalt stræk. Skift side.",
      whyItMatters: "Træner rotation og anti-rotation i samme gentagelse — den kropskontrol der overfører kraft fra gulvet ind i hvert spark og slag.",
      alternatives: [{ name: "Bird Dog", reason: "Enklere version med samme anti-rotationskrav" }],
    },
    {
      name: "Knästående Knätapp med Korsräckning",
      notes: "Stå på alla fyra med knäna svävande strax över golvet. Tappa ner ena knät lätt, för sedan samma sidas arm in under kroppen och öppna till sist upp i en hög diagonal räckning. Byt sida.",
      whyItMatters: "Tränar rotation och antirotation i samma repetition — bålkontrollen som överför kraft från golvet till varje spark och slag.",
      alternatives: [{ name: "Bird Dog", reason: "Enklare version med samma antirotationskrav" }],
    },
    {
      name: "Knestand med Knetapp og Kryssrekk",
      notes: "Stå på alle fire med knærne svevende rett over gulvet. Tapp det ene kneet lett ned, før deretter samme sides arm inn under kroppen og åpne til slutt opp i en høy diagonal rekk. Bytt side.",
      whyItMatters: "Trener rotasjon og antirotasjon i samme repetisjon — kroppskontrollen som overfører kraft fra gulvet inn i hvert spark og slag.",
      alternatives: [{ name: "Bird Dog", reason: "Enklere versjon med samme antirotasjonskrav" }],
    },
  ),

  cobraToShoulderStretch: E(
    { id: "cobra-to-shoulder-stretch", category: "mobility", muscleGroups: ["chest", "shoulders", "back", "core"], sets: 2, reps: "6-8 each side", tempo: "3 sec hold in each end position", rest: "30 sec", videoId: "" },
    {
      name: "Cobra to Shoulder Stretch",
      notes: "Lie prone and press up into a cobra with the hips down and the chest open. From there, thread one arm under the chest and lower the shoulder to the floor for 3 sec. Press back up to cobra and switch sides.",
      whyItMatters: "Combines spinal extension with a shoulder and upper-back stretch — undoes the rounded posture from sitting and restores the overhead and guard positions.",
      alternatives: [{ name: "Sphinx Pose", reason: "Gentler extension if the low back is sensitive" }],
    },
    {
      name: "Kobra til Skulderstræk",
      notes: "Lig på maven og pres op i en kobra med hoften nede og brystet åbent. Før derefter den ene arm ind under brystet og sænk skulderen til gulvet i 3 sek. Pres op i kobra igen og skift side.",
      whyItMatters: "Kombinerer rygstrækning med et skulder- og øvre ryg-stræk — modvirker den runde holdning fra siddende arbejde og genskaber gard- og overhovedpositionen.",
      alternatives: [{ name: "Sfinks", reason: "Blidere strækning, hvis lænden er følsom" }],
    },
    {
      name: "Kobra till Axelstretch",
      notes: "Ligg på mage och pressa upp i en kobra med höften nere och bröstet öppet. För sedan ena armen in under bröstet och sänk axeln mot golvet i 3 sek. Pressa upp i kobra igen och byt sida.",
      whyItMatters: "Kombinerar ryggextension med en axel- och bröstryggsstretch — motverkar den rundade hållningen från sittande och återställer gard- och överhuvudpositionen.",
      alternatives: [{ name: "Sfinx", reason: "Mildare extension om ländryggen är känslig" }],
    },
    {
      name: "Kobra til Skulderstrekk",
      notes: "Ligg på magen og press opp i en kobra med hoften nede og brystet åpent. Før deretter den ene armen inn under brystet og senk skulderen mot gulvet i 3 sek. Press opp i kobra igjen og bytt side.",
      whyItMatters: "Kombinerer ryggekstensjon med et skulder- og øvre rygg-strekk — motvirker den runde holdningen fra sitting og gjenoppretter gard- og overhodeposisjonen.",
      alternatives: [{ name: "Sfinks", reason: "Mildere ekstensjon hvis korsryggen er sensitiv" }],
    },
  ),

  sideBend9090: E(
    { id: "90-90-side-bend-stretch", category: "mobility", muscleGroups: ["hip-flexors", "glutes", "core", "back"], sets: 2, reps: "6-8 each side", tempo: "3-5 sec hold", rest: "30 sec", videoId: "" },
    {
      name: "90 to 90 Side Bend Stretch",
      notes: "Sit in the 90/90 position with front and back leg at 90°. Place the front-side hand on the floor and reach the other arm overhead and across, bending the trunk sideways over the front leg. Hold 3-5 sec, then switch.",
      whyItMatters: "Stretches the hip rotators and the whole lateral chain at once — more hip rotation and side bend means higher, cleaner roundhouse and side kicks.",
      alternatives: [{ name: "90/90 Hip Switch", reason: "Rotation only, without the side bend" }],
    },
    {
      name: "90/90 Sidebøjningsstræk",
      notes: "Sid i 90/90-position med forreste og bagerste ben i 90°. Sæt hånden på gulvet i forbenets side og stræk den anden arm op over hovedet og hen over, mens du bøjer overkroppen sidelæns hen over forbenet. Hold 3-5 sek. og skift.",
      whyItMatters: "Strækker hofterotatorerne og hele den laterale kæde på én gang — mere hofterotation og sidebøjning giver højere og renere roundhouse- og sidespark.",
      alternatives: [{ name: "90/90 Hofteskift", reason: "Kun rotation, uden sidebøjningen" }],
    },
    {
      name: "90/90 Sidoböjningsstretch",
      notes: "Sitt i 90/90-position med främre och bakre ben i 90°. Sätt handen i golvet på främre benets sida och sträck den andra armen över huvudet och åt sidan medan du böjer överkroppen över främre benet. Håll 3-5 sek och byt.",
      whyItMatters: "Stretchar höftrotatorerna och hela sidokedjan samtidigt — mer höftrotation och sidoböjning ger högre och renare rundsparkar och sidsparkar.",
      alternatives: [{ name: "90/90 Höftväxling", reason: "Endast rotation, utan sidoböjningen" }],
    },
    {
      name: "90/90 Sidebøyningsstrekk",
      notes: "Sitt i 90/90-posisjon med fremre og bakre ben i 90°. Sett hånden i gulvet på fremre bens side og strekk den andre armen over hodet og til siden mens du bøyer overkroppen over fremre ben. Hold 3-5 sek og bytt.",
      whyItMatters: "Strekker hofterotatorene og hele sidekjeden samtidig — mer hofterotasjon og sidebøy gir høyere og renere rundspark og sidespark.",
      alternatives: [{ name: "90/90 Hofteveksling", reason: "Kun rotasjon, uten sidebøyen" }],
    },
  ),

  highPlankToSideHipStretch: E(
    { id: "high-plank-to-side-hip-stretch", category: "mobility", muscleGroups: ["hip-flexors", "glutes", "core", "shoulders"], sets: 2, reps: "6-8 each side", tempo: "3 sec hold in the lunge", rest: "30 sec", videoId: "" },
    {
      name: "High Plank to Side Hip Stretch",
      notes: "From a high plank, step one foot up outside the same-side hand into a deep lunge. Drop the back hip toward the floor, then rotate the trunk and reach the inside arm up toward the ceiling. Hold 3 sec, return to plank, switch sides.",
      whyItMatters: "Loosens the hip flexors of the trailing leg while opening thoracic rotation — the combination that gives a longer stride and a stronger turn into a kick.",
      alternatives: [{ name: "Half-Kneeling Hip Flexor Stretch", reason: "Static, floor-supported version" }],
    },
    {
      name: "Høj Planke til Sidehoftestræk",
      notes: "Fra høj planke træder du den ene fod op uden om hånden i samme side til et dybt udfald. Sænk den bagerste hofte mod gulvet, rotér derefter overkroppen og stræk den inderste arm op mod loftet. Hold 3 sek., tilbage til planke, skift side.",
      whyItMatters: "Løsner hoftebøjerne på bagbenet, mens den thorakale rotation åbnes — kombinationen der giver længere skridt og en stærkere drejning ind i sparket.",
      alternatives: [{ name: "Hoftebøjerstræk i Halv Knæstand", reason: "Statisk version med støtte i gulvet" }],
    },
    {
      name: "Hög Planka till Sidohöftstretch",
      notes: "Från hög planka kliver du upp ena foten utanför handen på samma sida till ett djupt utfall. Sänk bakre höften mot golvet, rotera sedan överkroppen och sträck den inre armen mot taket. Håll 3 sek, tillbaka till planka, byt sida.",
      whyItMatters: "Löser upp höftböjarna i bakre benet samtidigt som bröstryggsrotationen öppnas — kombinationen som ger längre steg och starkare vridning in i sparken.",
      alternatives: [{ name: "Höftböjarstretch i Halvknästående", reason: "Statisk version med stöd i golvet" }],
    },
    {
      name: "Høy Planke til Sidehoftestrekk",
      notes: "Fra høy planke setter du den ene foten opp utenfor hånden på samme side til et dypt utfall. Senk den bakre hoften mot gulvet, roter deretter overkroppen og strekk den indre armen opp mot taket. Hold 3 sek, tilbake til planke, bytt side.",
      whyItMatters: "Løsner hofteboøyerne i bakre ben mens torakal rotasjon åpnes — kombinasjonen som gir lengre steg og sterkere vridning inn i sparket.",
      alternatives: [{ name: "Hofteboøyerstrekk i Halv Knestand", reason: "Statisk versjon med støtte i gulvet" }],
    },
  ),
};
