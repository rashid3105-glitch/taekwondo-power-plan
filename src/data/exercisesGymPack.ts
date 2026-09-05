// Gym pack — cable strength, extra mobility, general fitness and plyometrics.
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

export const exercisesGymPack: Record<string, Base> = {
  /* ---------------- CABLE STRENGTH ---------------- */

  cableWoodchopHighToLow: E(
    { id: "cable-woodchop-high-to-low", category: "strength", muscleGroups: ["core", "shoulders", "glutes"], sets: 3, reps: "10-12 each side", tempo: "2-0-1-0", rest: "60 sec", videoId: "" },
    {
      name: "Cable Woodchop (High to Low)",
      notes: "Set the pulley high. Stand side-on, arms long, and pull the handle diagonally down across the body while the back hip rotates. Keep the arms straight and let the trunk do the work.",
      whyItMatters: "Trains the rotational chain that transfers hip power into the upper body — the same pattern as a punch or a turning kick.",
      alternatives: [{ name: "Band Woodchop", reason: "Use a band if no cable stack is available" }],
    },
    {
      name: "Kabel Woodchop (høj til lav)",
      notes: "Sæt trissen højt. Stå sidelæns med lange arme og træk håndtaget diagonalt ned foran kroppen, mens bageste hofte roterer. Hold armene strakte og lad kroppen arbejde.",
      whyItMatters: "Træner rotationskæden, der overfører hoftekraft til overkroppen — samme mønster som et slag eller et roterende spark.",
      alternatives: [{ name: "Elastik Woodchop", reason: "Brug elastik hvis der ikke er kabeltårn" }],
    },
    {
      name: "Kabel Woodchop (hög till låg)",
      notes: "Sätt kabeln högt. Stå med sidan mot maskinen, långa armar, och dra handtaget diagonalt ner framför kroppen medan bakre höften roterar.",
      whyItMatters: "Tränar rotationskedjan som överför höftkraft till överkroppen — samma mönster som en spark eller ett slag.",
      alternatives: [{ name: "Gummiband Woodchop", reason: "Använd band om kabelmaskin saknas" }],
    },
    {
      name: "Kabel Woodchop (høy til lav)",
      notes: "Sett trinsen høyt. Stå sidelengs med lange armer og dra håndtaket diagonalt ned foran kroppen mens bakre hofte roterer.",
      whyItMatters: "Trener rotasjonskjeden som overfører hoftekraft til overkroppen — samme mønster som et slag eller et roterende spark.",
      alternatives: [{ name: "Strikk Woodchop", reason: "Bruk strikk hvis kabeltårn mangler" }],
    },
  ),

  cableWoodchopLowToHigh: E(
    { id: "cable-woodchop-low-to-high", category: "strength", muscleGroups: ["core", "glutes", "shoulders"], sets: 3, reps: "10-12 each side", tempo: "1-0-1-0", rest: "60 sec", videoId: "" },
    {
      name: "Cable Chop (Low to High)",
      notes: "Pulley at the floor. Drive the handle diagonally up and across, finishing with the arms above the opposite shoulder. Push through the back foot as you rotate.",
      whyItMatters: "Builds the upward rotational drive used in rising kicks and clinch work, and strengthens the obliques in an extending position.",
      alternatives: [{ name: "Med Ball Scoop Throw", reason: "More explosive variation" }],
    },
    {
      name: "Kabel Chop (lav til høj)",
      notes: "Trisse i gulvhøjde. Før håndtaget diagonalt op og over kroppen og slut med armene over modsatte skulder. Skub fra med bageste fod, mens du roterer.",
      whyItMatters: "Bygger den opadgående rotationskraft, du bruger i stigende spark og i clinch, og styrker de skrå mavemuskler i strækposition.",
      alternatives: [{ name: "Medicinbold Scoop-kast", reason: "Mere eksplosiv variant" }],
    },
    {
      name: "Kabel Chop (låg till hög)",
      notes: "Kabeln vid golvet. För handtaget diagonalt upp och över kroppen, avsluta med armarna över motsatt axel. Tryck ifrån med bakre foten.",
      whyItMatters: "Bygger den uppåtgående rotationskraften i stigande sparkar och stärker sneda bukmuskler i sträckt läge.",
      alternatives: [{ name: "Medicinboll Scoop-kast", reason: "Mer explosiv variant" }],
    },
    {
      name: "Kabel Chop (lav til høy)",
      notes: "Trinse i gulvhøyde. Før håndtaket diagonalt opp og over kroppen, avslutt med armene over motsatt skulder. Skyv fra med bakre fot.",
      whyItMatters: "Bygger den oppadgående rotasjonskraften i stigende spark og styrker skrå magemuskler i strekk.",
      alternatives: [{ name: "Medisinball Scoop-kast", reason: "Mer eksplosiv variant" }],
    },
  ),

  cableHipAbduction: E(
    { id: "cable-hip-abduction", category: "strength", muscleGroups: ["glutes", "core"], sets: 3, reps: "12-15 each leg", tempo: "2-1-2-0", rest: "45 sec", videoId: "" },
    {
      name: "Cable Standing Hip Abduction",
      notes: "Cuff at the ankle, cable at the lowest setting. Stand tall, hold something for balance and lift the working leg straight out to the side without leaning. Lower slowly.",
      whyItMatters: "Strengthens gluteus medius, which stabilises the standing leg on every single kick — weak here and the hip drops and the kick loses height.",
      alternatives: [{ name: "Band Side Step", reason: "No cable needed" }],
    },
    {
      name: "Kabel Hofteabduktion (stående)",
      notes: "Manchet om anklen, kabel i laveste position. Stå højt, hold ved for balance og løft benet lige ud til siden uden at læne dig. Sænk langsomt.",
      whyItMatters: "Styrker gluteus medius, som stabiliserer standbenet i hvert eneste spark — er den svag, falder hoften og sparket mister højde.",
      alternatives: [{ name: "Elastik sidesteps", reason: "Kræver ingen kabel" }],
    },
    {
      name: "Kabel Höftabduktion (stående)",
      notes: "Manschett om fotleden, kabeln lågt. Stå högt, håll i för balans och lyft benet rakt ut åt sidan utan att luta dig. Sänk långsamt.",
      whyItMatters: "Stärker gluteus medius som stabiliserar stödbenet i varje spark.",
      alternatives: [{ name: "Gummiband sidsteg", reason: "Kräver ingen kabel" }],
    },
    {
      name: "Kabel Hofteabduksjon (stående)",
      notes: "Mansjett rundt ankelen, kabel lavt. Stå høyt, hold i noe for balanse og løft beinet rett ut til siden uten å lene deg. Senk sakte.",
      whyItMatters: "Styrker gluteus medius som stabiliserer standbeinet i hvert spark.",
      alternatives: [{ name: "Strikk sidesteg", reason: "Krever ingen kabel" }],
    },
  ),

  cableHipFlexion: E(
    { id: "cable-hip-flexion", category: "strength", muscleGroups: ["hip-flexors", "core", "quads"], sets: 3, reps: "10-12 each leg", tempo: "1-0-2-0", rest: "45 sec", videoId: "" },
    {
      name: "Cable Knee Drive (Hip Flexion)",
      notes: "Ankle cuff, facing away from the stack. Drive the knee up to hip height fast, then resist slowly on the way back down. Keep the chest tall.",
      whyItMatters: "Loads the chamber position of the kick directly — a stronger hip flexor means a faster, higher knee lift before the kick extends.",
      alternatives: [{ name: "Banded Hip Flexor Drive", reason: "Same pattern with a band" }],
    },
    {
      name: "Kabel Knæløft (hoftebøj)",
      notes: "Ankelmanchet, med ryggen til tårnet. Før knæet hurtigt op i hoftehøjde og brems langsomt på vej ned. Hold brystet højt.",
      whyItMatters: "Belaster optrækket til sparket direkte — en stærkere hoftebøjer giver et hurtigere og højere knæløft, før sparket strækkes ud.",
      alternatives: [{ name: "Elastik hoftebøjer-træk", reason: "Samme mønster med elastik" }],
    },
    {
      name: "Kabel Knälyft (höftflexion)",
      notes: "Fotledsmanschett, med ryggen mot maskinen. För knäet snabbt upp till höfthöjd och bromsa långsamt på vägen ner.",
      whyItMatters: "Belastar sparkupptaget direkt — starkare höftböjare ger snabbare och högre knälyft.",
      alternatives: [{ name: "Gummiband höftböjardrag", reason: "Samma mönster med band" }],
    },
    {
      name: "Kabel Knéløft (hofteboks)",
      notes: "Ankelmansjett, med ryggen mot tårnet. Før kneet raskt opp i hoftehøyde og brems sakte på vei ned.",
      whyItMatters: "Belaster sparkopptrekket direkte — sterkere hofteboyer gir raskere og høyere kneløft.",
      alternatives: [{ name: "Strikk hofteboyer-drag", reason: "Samme mønster med strikk" }],
    },
  ),

  cableSingleArmRow: E(
    { id: "cable-single-arm-row", category: "strength", muscleGroups: ["back", "shoulders", "core"], sets: 3, reps: "10-12 each arm", tempo: "2-1-2-0", rest: "60 sec", videoId: "" },
    {
      name: "Cable Single-Arm Row",
      notes: "Split stance, cable at chest height. Pull the handle to the ribs, elbow close, and let the shoulder blade travel back. Resist the rotation of the trunk on the way out.",
      whyItMatters: "Builds pulling strength and anti-rotation control at the same time — important for guard, clinch and shoulder health after lots of kicking.",
      alternatives: [{ name: "One-Arm Dumbbell Row", reason: "Free-weight version" }],
    },
    {
      name: "Kabel Enarms Roning",
      notes: "Splitstand, kabel i brysthøjde. Træk håndtaget ind til ribbenene med albuen tæt på kroppen og lad skulderbladet køre bagud. Modstå rotationen i kroppen på vej ud.",
      whyItMatters: "Bygger trækstyrke og anti-rotationskontrol samtidig — vigtigt for garde, clinch og skuldersundhed.",
      alternatives: [{ name: "Enarms håndvægtsroning", reason: "Version med frie vægte" }],
    },
    {
      name: "Kabel Enarmsrodd",
      notes: "Splitstående, kabel i brösthöjd. Dra handtaget till revbenen med armbågen nära kroppen. Motstå rotationen på vägen ut.",
      whyItMatters: "Bygger dragstyrka och antirotationskontroll samtidigt.",
      alternatives: [{ name: "Enarms hantelrodd", reason: "Version med fria vikter" }],
    },
    {
      name: "Kabel Enarms Roing",
      notes: "Splittstilling, kabel i brysthøyde. Dra håndtaket inn til ribbeina med albuen tett på kroppen. Motstå rotasjonen på vei ut.",
      whyItMatters: "Bygger trekkstyrke og antirotasjonskontroll samtidig.",
      alternatives: [{ name: "Enarms manualroing", reason: "Versjon med frie vekter" }],
    },
  ),

  cablePullThrough: E(
    { id: "cable-pull-through", category: "strength", muscleGroups: ["glutes", "hamstrings", "back"], sets: 3, reps: "10-12", tempo: "2-0-1-1", rest: "60 sec", videoId: "" },
    {
      name: "Cable Pull-Through",
      notes: "Rope attachment low, facing away, rope between the legs. Hinge at the hips with a flat back, then snap the hips forward and squeeze the glutes at the top. Arms stay passive.",
      whyItMatters: "Teaches a fast hip hinge with light load — the hip snap that finishes every powerful kick and throw.",
      alternatives: [{ name: "Kettlebell Swing", reason: "More ballistic alternative" }],
    },
    {
      name: "Kabel Pull-Through",
      notes: "Reb i lav position, med ryggen til, rebet mellem benene. Hængsl i hoften med flad ryg og skyd derefter hoften frem og spænd ballerne i toppen. Armene er passive.",
      whyItMatters: "Lærer et hurtigt hoftehængsel med let belastning — det hofteskub, der afslutter ethvert kraftfuldt spark og kast.",
      alternatives: [{ name: "Kettlebell Swing", reason: "Mere ballistisk alternativ" }],
    },
    {
      name: "Kabel Pull-Through",
      notes: "Rep lågt, med ryggen mot maskinen, repet mellan benen. Fäll i höften med rak rygg och skjut sedan fram höften och spänn sätet i toppen.",
      whyItMatters: "Lär in ett snabbt höftfäll med lätt belastning — höftskjutet som avslutar varje kraftfull spark.",
      alternatives: [{ name: "Kettlebell Swing", reason: "Mer ballistiskt alternativ" }],
    },
    {
      name: "Kabel Pull-Through",
      notes: "Tau lavt, med ryggen mot maskinen, tauet mellom beina. Hengsle i hoften med rak rygg og skyv så hoften frem og klem setet i toppen.",
      whyItMatters: "Lærer et raskt hoftehengsel med lett belastning — hofteskyvet som avslutter hvert kraftfullt spark.",
      alternatives: [{ name: "Kettlebell Swing", reason: "Mer ballistisk alternativ" }],
    },
  ),

  cableFacePull: E(
    { id: "cable-face-pull", category: "strength", muscleGroups: ["shoulders", "back"], sets: 3, reps: "12-15", tempo: "2-1-2-0", rest: "45 sec", videoId: "" },
    {
      name: "Cable Face Pull",
      notes: "Rope at eye height. Pull towards the forehead, elbows high, and finish by rotating the hands back into a double biceps position. Hold 1 sec.",
      whyItMatters: "Balances all the pushing and guarding work and keeps the shoulders healthy — a simple insurance policy for the upper body.",
      alternatives: [{ name: "Band Pull-Apart", reason: "Do it anywhere with a band" }],
    },
    {
      name: "Kabel Face Pull",
      notes: "Reb i øjenhøjde. Træk mod panden med høje albuer og slut med at rotere hænderne bagud i dobbelt biceps-position. Hold 1 sek.",
      whyItMatters: "Balancerer alt pres- og gardearbejde og holder skuldrene sunde — en billig forsikring for overkroppen.",
      alternatives: [{ name: "Elastik pull-apart", reason: "Kan laves overalt" }],
    },
    {
      name: "Kabel Face Pull",
      notes: "Rep i ögonhöjd. Dra mot pannan med höga armbågar och avsluta med att rotera händerna bakåt. Håll 1 sek.",
      whyItMatters: "Balanserar allt tryckarbete och håller axlarna friska.",
      alternatives: [{ name: "Gummiband pull-apart", reason: "Kan göras var som helst" }],
    },
    {
      name: "Kabel Face Pull",
      notes: "Tau i øyenhøyde. Dra mot pannen med høye albuer og avslutt med å rotere hendene bakover. Hold 1 sek.",
      whyItMatters: "Balanserer alt pressarbeid og holder skuldrene friske.",
      alternatives: [{ name: "Strikk pull-apart", reason: "Kan gjøres overalt" }],
    },
  ),

  cableAntiRotationPress: E(
    { id: "cable-anti-rotation-press", category: "strength", muscleGroups: ["core", "shoulders", "glutes"], sets: 3, reps: "8-10 each side", tempo: "1-3-1-0", rest: "45 sec", videoId: "" },
    {
      name: "Cable Anti-Rotation Press",
      notes: "Stand side-on to the cable at chest height, handle at the sternum. Press straight out and hold 3 sec while refusing to rotate, then return. Squeeze the glutes throughout.",
      whyItMatters: "Trains the trunk to stay solid while the limbs move — the stiffness that stops power leaking out on impact.",
      alternatives: [{ name: "Half-Kneeling Pallof Press", reason: "Removes the legs from the equation" }],
    },
    {
      name: "Kabel Anti-Rotationspres",
      notes: "Stå sidelæns for kablen i brysthøjde med håndtaget ved brystbenet. Pres lige frem, hold 3 sek. uden at rotere, og før tilbage. Hold ballerne spændt.",
      whyItMatters: "Træner kroppen til at stå fast, mens arme og ben bevæger sig — den stivhed, der forhindrer kraft i at sive væk ved sammenstød.",
      alternatives: [{ name: "Pallof Press på knæ", reason: "Tager benene ud af ligningen" }],
    },
    {
      name: "Kabel Antirotationspress",
      notes: "Stå med sidan mot kabeln i brösthöjd. Pressa rakt fram, håll 3 sek utan att rotera, och för tillbaka.",
      whyItMatters: "Tränar bålen att stå stadigt medan armar och ben rör sig.",
      alternatives: [{ name: "Pallof Press på knä", reason: "Tar bort benen ur ekvationen" }],
    },
    {
      name: "Kabel Antirotasjonspress",
      notes: "Stå sidelengs mot kabelen i brysthøyde. Press rett frem, hold 3 sek uten å rotere, og før tilbake.",
      whyItMatters: "Trener kjernen til å stå stødig mens armer og bein beveger seg.",
      alternatives: [{ name: "Pallof Press på kne", reason: "Tar beina ut av ligningen" }],
    },
  ),

  /* ---------------- MOBILITY ---------------- */

  ninetyNinetyHipSwitch: E(
    { id: "ninety-ninety-hip-switch", category: "mobility", muscleGroups: ["hip-flexors", "glutes", "core"], sets: 2, reps: "8-10 switches", tempo: "Slow & controlled", rest: "30 sec", videoId: "" },
    {
      name: "90/90 Hip Switch",
      notes: "Sit with both knees bent at 90 degrees, one leg in front, one to the side. Keep the chest tall and rotate both knees to the other side without using the hands.",
      whyItMatters: "Builds usable internal and external hip rotation, which is what lets the hip open fully in a roundhouse without the back compensating.",
      alternatives: [{ name: "Seated Butterfly", reason: "Easier entry point if the hips are stiff" }],
    },
    {
      name: "90/90 Hofteskift",
      notes: "Sid med begge knæ i 90 grader, ét ben foran og ét til siden. Hold brystet højt og rotér begge knæ over til den anden side uden at bruge hænderne.",
      whyItMatters: "Bygger brugbar indad- og udadrotation i hoften — det, der lader hoften åbne helt i et roundhouse uden at ryggen kompenserer.",
      alternatives: [{ name: "Siddende sommerfugl", reason: "Lettere indgang hvis hofterne er stive" }],
    },
    {
      name: "90/90 Höftväxling",
      notes: "Sitt med båda knäna i 90 grader, ett ben fram och ett åt sidan. Håll bröstet högt och rotera båda knäna till andra sidan utan händerna.",
      whyItMatters: "Bygger användbar in- och utåtrotation i höften som låter höften öppna fullt i en roundhouse.",
      alternatives: [{ name: "Sittande fjäril", reason: "Enklare ingång om höfterna är stela" }],
    },
    {
      name: "90/90 Hoftebytte",
      notes: "Sitt med begge knær i 90 grader, ett bein foran og ett til siden. Hold brystet høyt og roter begge knær til andre siden uten hendene.",
      whyItMatters: "Bygger brukbar inn- og utoverrotasjon i hoften som lar hoften åpne helt i et roundhouse.",
      alternatives: [{ name: "Sittende sommerfugl", reason: "Enklere inngang hvis hoftene er stive" }],
    },
  ),

  couchStretch: E(
    { id: "couch-stretch", category: "mobility", muscleGroups: ["hip-flexors", "quads"], sets: 2, reps: "45-60 sec each side", tempo: "Static hold", rest: "20 sec", videoId: "" },
    {
      name: "Couch Stretch",
      notes: "Back foot up on a bench or wall, front foot planted. Squeeze the glute on the back leg and lift the chest until you feel the front of the hip open. Breathe slowly.",
      whyItMatters: "Long hip flexors mean the standing hip can extend fully — that extension is where kicking range and sprint stride come from.",
      alternatives: [{ name: "Half-Kneeling Hip Flexor Stretch", reason: "Gentler version without the wall" }],
    },
    {
      name: "Couch Stretch",
      notes: "Bageste fod op på en bænk eller væg, forreste fod plantet. Spænd ballen i bageste ben og løft brystet, til du mærker forsiden af hoften åbne. Træk vejret roligt.",
      whyItMatters: "Lange hoftebøjere betyder, at standhoften kan strække helt ud — og det er dér, sparkerækkevidde og skridtlængde kommer fra.",
      alternatives: [{ name: "Hoftebøjerstræk på knæ", reason: "Mildere version uden væg" }],
    },
    {
      name: "Couch Stretch",
      notes: "Bakre foten upp på bänk eller vägg, främre foten planterad. Spänn sätet i bakre benet och lyft bröstet tills framsidan av höften öppnas.",
      whyItMatters: "Långa höftböjare gör att stödhöften kan sträckas helt — där kommer sparkräckvidd ifrån.",
      alternatives: [{ name: "Höftböjarstretch på knä", reason: "Mildare version" }],
    },
    {
      name: "Couch Stretch",
      notes: "Bakre fot opp på benk eller vegg, fremre fot plantet. Klem setet i bakre bein og løft brystet til forsiden av hoften åpner seg.",
      whyItMatters: "Lange hofteboyere gjør at standhoften kan strekkes helt ut — der kommer sparkrekkevidden fra.",
      alternatives: [{ name: "Hofteboyerstrekk på kne", reason: "Mildere versjon" }],
    },
  ),

  thoracicOpener: E(
    { id: "thoracic-opener-side-lying", category: "mobility", muscleGroups: ["back", "shoulders", "chest"], sets: 2, reps: "8-10 each side", tempo: "3 sec at end range", rest: "20 sec", videoId: "" },
    {
      name: "Side-Lying Thoracic Opener",
      notes: "Lie on your side, knees stacked at 90 degrees on a foam roller, arms straight in front. Open the top arm in a big arc towards the floor behind you and follow it with your eyes.",
      whyItMatters: "Frees up the upper back so the shoulders can rotate without the lower back twisting — cleaner rotation, less back load.",
      alternatives: [{ name: "Thread the Needle", reason: "Quadruped version" }],
    },
    {
      name: "Sideliggende Brystrygsåbner",
      notes: "Lig på siden med knæene i 90 grader oven på hinanden og armene strakt frem. Åbn øverste arm i en stor bue mod gulvet bag dig og følg hånden med øjnene.",
      whyItMatters: "Frigør brystryggen, så skuldrene kan rotere uden at lænden vrider med — renere rotation og mindre belastning på ryggen.",
      alternatives: [{ name: "Thread the Needle", reason: "Version på alle fire" }],
    },
    {
      name: "Sidliggande Bröstryggsöppnare",
      notes: "Ligg på sidan med knäna i 90 grader och armarna rakt fram. Öppna översta armen i en stor båge mot golvet bakom dig och följ handen med blicken.",
      whyItMatters: "Frigör bröstryggen så axlarna kan rotera utan att ländryggen vrider med.",
      alternatives: [{ name: "Thread the Needle", reason: "Version på alla fyra" }],
    },
    {
      name: "Sideliggende Brystryggsåpner",
      notes: "Ligg på siden med knærne i 90 grader og armene rett frem. Åpne øverste arm i en stor bue mot gulvet bak deg og følg hånden med blikket.",
      whyItMatters: "Frigjør brystryggen så skuldrene kan rotere uten at korsryggen vrir med.",
      alternatives: [{ name: "Thread the Needle", reason: "Versjon på alle fire" }],
    },
  ),

  ankleWallMobilization: E(
    { id: "ankle-wall-mobilization", category: "mobility", muscleGroups: ["calves", "quads"], sets: 2, reps: "10-12 each leg", tempo: "2 sec at end range", rest: "20 sec", videoId: "" },
    {
      name: "Ankle Wall Mobilisation",
      notes: "Stand a hand's width from a wall. Drive the knee forward over the toes to touch the wall with the heel flat on the floor. Move the foot back a little every few reps.",
      whyItMatters: "Ankle range decides how deep you can sit in a stance and how well you absorb landings — the cheapest mobility win there is.",
      alternatives: [{ name: "Deep Squat Hold", reason: "Loads both ankles at once" }],
    },
    {
      name: "Ankelmobilisering mod væg",
      notes: "Stå en håndsbredde fra væggen. Kør knæet frem over tæerne, til det rører væggen, mens hælen bliver i gulvet. Flyt foden lidt længere væk hvert par gentagelser.",
      whyItMatters: "Ankelbevægeligheden afgør, hvor dybt du kan sidde i en stand, og hvor godt du absorberer landinger — den billigste mobilitetsgevinst der findes.",
      alternatives: [{ name: "Dyb squat hold", reason: "Belaster begge ankler på én gang" }],
    },
    {
      name: "Fotledsmobilisering mot vägg",
      notes: "Stå en handsbredd från väggen. Kör knäet fram över tårna tills det nuddar väggen med hälen kvar i golvet.",
      whyItMatters: "Fotledsrörligheten avgör hur djupt du kan sitta i en ställning och hur väl du tar emot landningar.",
      alternatives: [{ name: "Djup knäböj håll", reason: "Belastar båda fotlederna samtidigt" }],
    },
    {
      name: "Ankelmobilisering mot vegg",
      notes: "Stå en håndsbredde fra veggen. Kjør kneet frem over tærne til det berører veggen med hælen i gulvet.",
      whyItMatters: "Ankelbevegeligheten avgjør hvor dypt du kan sitte i en stilling og hvor godt du tar imot landinger.",
      alternatives: [{ name: "Dyp knebøy hold", reason: "Belaster begge ankler samtidig" }],
    },
  ),

  activeHamstringFloss: E(
    { id: "active-hamstring-floss", category: "mobility", muscleGroups: ["hamstrings", "calves", "core"], sets: 2, reps: "10-12 each leg", tempo: "Controlled", rest: "20 sec", videoId: "" },
    {
      name: "Active Hamstring Floss",
      notes: "Lie on your back with one leg bent. Raise the other leg straight up as high as it goes with the knee locked, then lower slowly. Keep the low back flat on the floor.",
      whyItMatters: "Builds active — not just passive — hamstring range, so the leg actually holds the height you stretch for in a high kick.",
      alternatives: [{ name: "Standing Leg Swing", reason: "Standing version, more sport-specific" }],
    },
    {
      name: "Aktiv Baglårs-floss",
      notes: "Lig på ryggen med det ene ben bøjet. Løft det andet ben lige op så højt som muligt med strakt knæ, og sænk langsomt. Hold lænden fladt i gulvet.",
      whyItMatters: "Bygger aktivt — ikke bare passivt — bevægeudslag i baglåret, så benet faktisk kan holde den højde, du strækker ud til i et højt spark.",
      alternatives: [{ name: "Stående bensving", reason: "Stående version, mere sportsspecifik" }],
    },
    {
      name: "Aktiv Hamstringsfloss",
      notes: "Ligg på rygg med ena benet böjt. Lyft det andra benet rakt upp så högt det går med sträckt knä och sänk långsamt.",
      whyItMatters: "Bygger aktiv rörlighet i hamstrings så benet faktiskt håller höjden i en hög spark.",
      alternatives: [{ name: "Stående bensving", reason: "Stående version" }],
    },
    {
      name: "Aktiv Hamstringfloss",
      notes: "Ligg på ryggen med ett bein bøyd. Løft det andre beinet rett opp så høyt som mulig med strakt kne, og senk sakte.",
      whyItMatters: "Bygger aktiv bevegelighet i hamstring så beinet faktisk holder høyden i et høyt spark.",
      alternatives: [{ name: "Stående bensving", reason: "Stående versjon" }],
    },
  ),

  /* ---------------- GENERAL FITNESS ---------------- */

  dumbbellGobletSquat: E(
    { id: "dumbbell-goblet-squat", category: "strength", muscleGroups: ["quads", "glutes", "core"], sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: "60 sec", videoId: "" },
    {
      name: "Goblet Squat",
      notes: "Hold a dumbbell or kettlebell at the chest. Sit straight down between the hips, elbows inside the knees at the bottom, then stand tall. Heels stay down.",
      whyItMatters: "The simplest way to build leg strength with a clean squat pattern — the load at the chest keeps the torso upright for you.",
      alternatives: [{ name: "Bodyweight Squat", reason: "Start here if the pattern is new" }],
    },
    {
      name: "Goblet Squat",
      notes: "Hold en håndvægt eller kettlebell ind til brystet. Sæt dig lige ned mellem hofterne med albuerne inden for knæene i bunden, og rejs dig højt op. Hælene bliver i gulvet.",
      whyItMatters: "Den enkleste måde at bygge benstyrke med et rent squat-mønster — vægten foran brystet holder automatisk overkroppen oprejst.",
      alternatives: [{ name: "Squat uden vægt", reason: "Start her hvis bevægelsen er ny" }],
    },
    {
      name: "Goblet Squat",
      notes: "Håll en hantel eller kettlebell mot bröstet. Sätt dig rakt ner mellan höfterna, armbågarna innanför knäna i botten, och res dig upp.",
      whyItMatters: "Enklaste sättet att bygga benstyrka med ett rent knäböjsmönster.",
      alternatives: [{ name: "Knäböj utan vikt", reason: "Börja här om rörelsen är ny" }],
    },
    {
      name: "Goblet Squat",
      notes: "Hold en manual eller kettlebell mot brystet. Sett deg rett ned mellom hoftene, albuene innenfor knærne i bunn, og reis deg opp.",
      whyItMatters: "Enkleste måten å bygge beinstyrke med et rent knebøymønster.",
      alternatives: [{ name: "Knebøy uten vekt", reason: "Start her hvis bevegelsen er ny" }],
    },
  ),

  pushUpTempo: E(
    { id: "tempo-push-up", category: "strength", muscleGroups: ["chest", "shoulders", "core"], sets: 3, reps: "8-12", tempo: "3-1-1-0", rest: "60 sec", videoId: "" },
    {
      name: "Tempo Push-Up",
      notes: "Hands under the shoulders, body in one line from head to heels. Lower for 3 sec, pause 1 sec an inch off the floor, then press up. Ribs stay down.",
      whyItMatters: "Builds pressing strength and a rigid trunk in one movement, and the slow tempo makes bodyweight hard enough to matter.",
      alternatives: [{ name: "Incline Push-Up", reason: "Hands elevated to reduce load" }],
    },
    {
      name: "Tempo Armbøjning",
      notes: "Hænder under skuldrene, kroppen i én linje fra hoved til hæle. Sænk i 3 sek., hold 1 sek. lige over gulvet, og pres op. Hold ribbenene nede.",
      whyItMatters: "Bygger pressestyrke og en stiv krop i én øvelse, og det langsomme tempo gør din egen kropsvægt hård nok til at rykke.",
      alternatives: [{ name: "Armbøjning på skrå", reason: "Hænderne hævet for mindre belastning" }],
    },
    {
      name: "Tempo Armhävning",
      notes: "Händer under axlarna, kroppen i en linje. Sänk i 3 sek, håll 1 sek strax över golvet, pressa upp.",
      whyItMatters: "Bygger pressstyrka och en stabil bål i en och samma övning.",
      alternatives: [{ name: "Armhävning på lutning", reason: "Händerna högre för mindre belastning" }],
    },
    {
      name: "Tempo Push-up",
      notes: "Hender under skuldrene, kroppen i én linje. Senk i 3 sek, hold 1 sek rett over gulvet, press opp.",
      whyItMatters: "Bygger pressstyrke og en stiv kjerne i én øvelse.",
      alternatives: [{ name: "Push-up på skrå", reason: "Hendene hevet for mindre belastning" }],
    },
  ),

  farmersCarry: E(
    { id: "farmers-carry", category: "strength", muscleGroups: ["core", "back", "shoulders"], sets: 3, reps: "30-40 m", tempo: "Steady walk", rest: "60 sec", videoId: "" },
    {
      name: "Farmer's Carry",
      notes: "Heavy dumbbell or kettlebell in each hand. Stand tall, shoulders down, and walk in a straight line with short controlled steps. Don't lean.",
      whyItMatters: "Grip, trunk and posture under real load — carries build the kind of full-body toughness that shows up late in a fight.",
      alternatives: [{ name: "Suitcase Carry", reason: "One-sided version, harder on the core" }],
    },
    {
      name: "Farmer's Carry",
      notes: "Tung håndvægt eller kettlebell i hver hånd. Stå højt med skuldrene nede og gå i en lige linje med korte, kontrollerede skridt. Læn dig ikke.",
      whyItMatters: "Greb, core og holdning under rigtig belastning — bæreøvelser bygger den robusthed, der viser sig sent i en kamp.",
      alternatives: [{ name: "Suitcase Carry", reason: "Ensidig version, hårdere for core" }],
    },
    {
      name: "Farmer's Carry",
      notes: "Tung hantel eller kettlebell i varje hand. Stå högt med axlarna ner och gå rakt fram med korta kontrollerade steg.",
      whyItMatters: "Grepp, bål och hållning under riktig belastning.",
      alternatives: [{ name: "Suitcase Carry", reason: "Ensidig version, tyngre för bålen" }],
    },
    {
      name: "Farmer's Carry",
      notes: "Tung manual eller kettlebell i hver hånd. Stå høyt med skuldrene ned og gå rett frem med korte kontrollerte steg.",
      whyItMatters: "Grep, kjerne og holdning under reell belastning.",
      alternatives: [{ name: "Suitcase Carry", reason: "Ensidig versjon, tyngre for kjernen" }],
    },
  ),

  dumbbellStepUp: E(
    { id: "dumbbell-step-up", category: "strength", muscleGroups: ["quads", "glutes", "calves"], sets: 3, reps: "8-10 each leg", tempo: "2-0-1-0", rest: "60 sec", videoId: "" },
    {
      name: "Dumbbell Step-Up",
      notes: "Box at knee height, dumbbell in each hand. Place the whole foot on the box and drive up through the heel without pushing off the back foot. Lower slowly.",
      whyItMatters: "One leg at a time, exactly like every step and every kick — it also finds and fixes side-to-side differences.",
      alternatives: [{ name: "Split Squat", reason: "Both feet on the floor, easier to balance" }],
    },
    {
      name: "Step-Up med håndvægte",
      notes: "Kasse i knæhøjde, håndvægt i hver hånd. Sæt hele foden på kassen og pres op gennem hælen uden at skubbe fra med bageste fod. Sænk langsomt.",
      whyItMatters: "Ét ben ad gangen, præcis som hvert skridt og hvert spark — og den afslører og udligner forskelle mellem siderne.",
      alternatives: [{ name: "Split squat", reason: "Begge fødder i gulvet, lettere balance" }],
    },
    {
      name: "Step-Up med hantlar",
      notes: "Låda i knähöjd, hantel i varje hand. Sätt hela foten på lådan och tryck upp genom hälen utan att skjuta ifrån med bakre foten.",
      whyItMatters: "Ett ben i taget, precis som varje steg och varje spark.",
      alternatives: [{ name: "Split squat", reason: "Båda fötterna i golvet" }],
    },
    {
      name: "Step-Up med manualer",
      notes: "Kasse i knehøyde, manual i hver hånd. Sett hele foten på kassen og press opp gjennom hælen uten å skyve fra med bakre fot.",
      whyItMatters: "Ett bein om gangen, akkurat som hvert steg og hvert spark.",
      alternatives: [{ name: "Splittknebøy", reason: "Begge føtter i gulvet" }],
    },
  ),

  deadBug: E(
    { id: "dead-bug", category: "strength", muscleGroups: ["core", "hip-flexors"], sets: 3, reps: "8-10 each side", tempo: "Slow, 3 sec out", rest: "45 sec", videoId: "" },
    {
      name: "Dead Bug",
      notes: "On your back, arms up and knees over hips at 90 degrees. Lower one arm and the opposite leg slowly while pressing the low back into the floor. Return and switch.",
      whyItMatters: "Teaches the core to hold position while the arms and legs move independently — the base for every rotational movement you make.",
      alternatives: [{ name: "Plank", reason: "Static option if coordination is the limiter" }],
    },
    {
      name: "Dead Bug",
      notes: "Lig på ryggen med armene op og knæene over hoften i 90 grader. Sænk den ene arm og modsatte ben langsomt, mens du presser lænden ned i gulvet. Skift side.",
      whyItMatters: "Lærer core at holde positionen, mens arme og ben bevæger sig frit — grundlaget for al rotation, du laver.",
      alternatives: [{ name: "Planke", reason: "Statisk løsning, hvis koordinationen driller" }],
    },
    {
      name: "Dead Bug",
      notes: "Ligg på rygg med armarna upp och knäna över höften i 90 grader. Sänk en arm och motsatt ben långsamt medan du pressar ländryggen i golvet.",
      whyItMatters: "Lär bålen att hålla position medan armar och ben rör sig fritt.",
      alternatives: [{ name: "Planka", reason: "Statiskt alternativ" }],
    },
    {
      name: "Dead Bug",
      notes: "Ligg på ryggen med armene opp og knærne over hoften i 90 grader. Senk én arm og motsatt bein sakte mens du presser korsryggen i gulvet.",
      whyItMatters: "Lærer kjernen å holde posisjon mens armer og bein beveger seg fritt.",
      alternatives: [{ name: "Planke", reason: "Statisk alternativ" }],
    },
  ),

  rowErgIntervals: E(
    { id: "row-erg-intervals", category: "strength", muscleGroups: ["back", "quads", "core"], sets: 6, reps: "250 m", tempo: "Hard, controlled stroke", rest: "90 sec", videoId: "" },
    {
      name: "Rowing Intervals",
      notes: "6 x 250 m on the rowing machine at a hard but repeatable pace. Legs first, then body, then arms. Keep the split time within 2 sec across all intervals.",
      whyItMatters: "Full-body conditioning that spares the legs from more impact — good for building a bigger engine between hard sparring days.",
      alternatives: [{ name: "Assault Bike Intervals", reason: "Same effect, even less impact" }],
    },
    {
      name: "Roergometer-intervaller",
      notes: "6 x 250 m på romaskinen i et hårdt, men gentageligt tempo. Ben først, så krop, så arme. Hold split-tiden inden for 2 sek. på alle intervaller.",
      whyItMatters: "Konditionstræning for hele kroppen, der skåner benene for stød — god til at bygge motor mellem hårde sparringsdage.",
      alternatives: [{ name: "Assault Bike-intervaller", reason: "Samme effekt, endnu mindre stød" }],
    },
    {
      name: "Roddintervaller",
      notes: "6 x 250 m på roddmaskin i högt men repeterbart tempo. Ben först, sedan kropp, sedan armar.",
      whyItMatters: "Konditionsträning för hela kroppen som skonar benen från stötar.",
      alternatives: [{ name: "Assault Bike-intervaller", reason: "Samma effekt, ännu mindre stötar" }],
    },
    {
      name: "Roergometer-intervaller",
      notes: "6 x 250 m på romaskin i hardt, men repeterbart tempo. Bein først, så kropp, så armer.",
      whyItMatters: "Kondisjonstrening for hele kroppen som skåner beina for støt.",
      alternatives: [{ name: "Assault Bike-intervaller", reason: "Samme effekt, enda mindre støt" }],
    },
  ),

  /* ---------------- PLYOMETRICS ---------------- */

  broadJump: E(
    { id: "standing-broad-jump", category: "plyometric", muscleGroups: ["glutes", "quads", "hamstrings", "calves"], sets: 4, reps: "4-5", tempo: "Max intent", rest: "90 sec", videoId: "" },
    {
      name: "Standing Broad Jump",
      notes: "Feet hip-width, swing the arms back, then jump as far forward as you can and stick the landing on two feet. Full reset between reps — quality over quantity.",
      whyItMatters: "The clearest measure of horizontal power, and horizontal power is what closes distance in sparring.",
      alternatives: [{ name: "Box Jump", reason: "Vertical version with a softer landing" }],
    },
    {
      name: "Længdespring fra stående",
      notes: "Fødder i hoftebredde, sving armene tilbage og spring så langt frem du kan. Land på to fødder og stå fast. Fuld pause mellem gentagelser — kvalitet frem for mængde.",
      whyItMatters: "Det tydeligste mål for vandret kraft, og vandret kraft er det, der lukker afstanden i sparring.",
      alternatives: [{ name: "Kassespring", reason: "Lodret version med blødere landing" }],
    },
    {
      name: "Längdhopp från stående",
      notes: "Fötter i höftbredd, sving armarna bakåt och hoppa så långt fram du kan. Landa på två fötter och stå stilla.",
      whyItMatters: "Tydligaste måttet på horisontell kraft — det som stänger avståndet i sparring.",
      alternatives: [{ name: "Lådhopp", reason: "Vertikal version med mjukare landning" }],
    },
    {
      name: "Lengdehopp fra stående",
      notes: "Føtter i hoftebredde, sving armene bakover og hopp så langt frem du kan. Land på to føtter og stå stille.",
      whyItMatters: "Tydeligste målet på horisontal kraft — det som lukker avstanden i sparring.",
      alternatives: [{ name: "Kassehopp", reason: "Vertikal versjon med mykere landing" }],
    },
  ),

  singleLegBoundLinear: E(
    { id: "single-leg-bound-linear", category: "plyometric", muscleGroups: ["glutes", "hamstrings", "calves", "core"], sets: 3, reps: "5-6 each leg", tempo: "Max intent", rest: "90 sec", videoId: "" },
    {
      name: "Single-Leg Bound",
      notes: "Bound forward from one leg to the same leg, aiming for distance and a stable landing. Arms drive opposite the legs. Stop the set the moment the landings get sloppy.",
      whyItMatters: "Every kick is launched and landed on one leg — bounding builds the single-leg spring and control that makes that safe and fast.",
      alternatives: [{ name: "Lateral Bound + Hold", reason: "Sideways version, easier to control" }],
    },
    {
      name: "Etbens-bounding",
      notes: "Spring fremad fra ét ben til samme ben efter længde og med stabil landing. Armene arbejder modsat benene. Stop sættet, så snart landingerne bliver sjuskede.",
      whyItMatters: "Hvert spark starter og lander på ét ben — bounding bygger den etbens-fjeder og kontrol, der gør det både hurtigt og sikkert.",
      alternatives: [{ name: "Sidehop med hold", reason: "Sidelæns version, lettere at styre" }],
    },
    {
      name: "Enbenshopp framåt",
      notes: "Hoppa framåt från ett ben till samma ben, sikta på längd och stabil landning. Avsluta setet när landningarna blir slarviga.",
      whyItMatters: "Varje spark startar och landar på ett ben — detta bygger enbensfjädringen.",
      alternatives: [{ name: "Sidohopp med håll", reason: "Sidledes version, lättare att styra" }],
    },
    {
      name: "Ettbens-bounding",
      notes: "Hopp fremover fra ett bein til samme bein etter lengde og med stabil landing. Stopp settet når landingene blir slurvete.",
      whyItMatters: "Hvert spark starter og lander på ett bein — dette bygger ettbensfjæren.",
      alternatives: [{ name: "Sidehopp med hold", reason: "Sidelengs versjon, lettere å styre" }],
    },
  ),

  hurdleHopsContinuous: E(
    { id: "hurdle-hops-continuous", category: "plyometric", muscleGroups: ["calves", "quads", "glutes"], sets: 4, reps: "6-8 hurdles", tempo: "Minimal ground contact", rest: "75 sec", videoId: "" },
    {
      name: "Continuous Hurdle Hops",
      notes: "Line up 6-8 low hurdles. Hop over them two-footed without pausing, staying tall and spending as little time on the ground as possible. Land on the balls of the feet.",
      whyItMatters: "Trains the stretch-shortening cycle at high frequency — this is what makes the bounce in your stance quick instead of heavy.",
      alternatives: [{ name: "Ankle Hops", reason: "No equipment, same stiffness focus" }],
    },
    {
      name: "Hækkehop i serie",
      notes: "Stil 6-8 lave hække op. Hop over dem samlet uden pause, hold kroppen høj og brug så lidt tid i gulvet som muligt. Land på forfoden.",
      whyItMatters: "Træner strækforkortningscyklussen ved høj frekvens — det er dét, der gør bouncet i din stand hurtigt i stedet for tungt.",
      alternatives: [{ name: "Ankelhop", reason: "Uden udstyr, samme fokus på stivhed" }],
    },
    {
      name: "Häckhopp i serie",
      notes: "Ställ upp 6-8 låga häckar. Hoppa över dem med båda fötterna utan paus och med minimal marktid. Landa på framfoten.",
      whyItMatters: "Tränar töj-förkortningscykeln i hög frekvens — det gör studsen i ställningen snabb.",
      alternatives: [{ name: "Fotledshopp", reason: "Utan utrustning" }],
    },
    {
      name: "Hekkehopp i serie",
      notes: "Sett opp 6-8 lave hekker. Hopp over dem samlet uten pause med minimal tid i bakken. Land på forfoten.",
      whyItMatters: "Trener strekk-forkortningssyklusen i høy frekvens — det gjør spensten i stillingen rask.",
      alternatives: [{ name: "Ankelhopp", reason: "Uten utstyr" }],
    },
  ),

  splitJump: E(
    { id: "scissor-split-jump", category: "plyometric", muscleGroups: ["quads", "glutes", "hip-flexors"], sets: 4, reps: "6-8 each side", tempo: "Explosive", rest: "75 sec", videoId: "" },
    {
      name: "Scissor Split Jump",
      notes: "Start in a split stance. Jump up and switch the legs in the air, landing softly in the opposite stance. Keep the torso upright and the chest facing forward.",
      whyItMatters: "Mirrors the switch-step in sparring — fast leg exchange with a controlled landing, which is how you change stance without losing balance.",
      alternatives: [{ name: "Jump Lunge", reason: "Slower, more strength-focused version" }],
    },
    {
      name: "Sakse-splitspring",
      notes: "Start i splitstand. Spring op og skift ben i luften, og land blødt i modsat stand. Hold overkroppen oprejst og brystet fremad.",
      whyItMatters: "Spejler switch-step i sparring — hurtigt benskifte med kontrolleret landing, så du kan skifte stand uden at miste balancen.",
      alternatives: [{ name: "Jump lunge", reason: "Langsommere og mere styrkefokuseret version" }],
    },
    {
      name: "Saxhopp i splitställning",
      notes: "Börja i splitställning. Hoppa upp och byt ben i luften, landa mjukt i motsatt ställning. Håll överkroppen upprätt.",
      whyItMatters: "Speglar switch-steget i sparring — snabbt benbyte med kontrollerad landning.",
      alternatives: [{ name: "Jump lunge", reason: "Långsammare, mer styrkefokuserad" }],
    },
    {
      name: "Saks-splitthopp",
      notes: "Start i splittstilling. Hopp opp og bytt bein i lufta, land mykt i motsatt stilling. Hold overkroppen oppreist.",
      whyItMatters: "Speiler switch-steget i sparring — raskt beinbytte med kontrollert landing.",
      alternatives: [{ name: "Jump lunge", reason: "Langsommere, mer styrkefokusert" }],
    },
  ),

  boxJumpToSingleLegLanding: E(
    { id: "box-jump-single-leg-landing", category: "plyometric", muscleGroups: ["glutes", "quads", "core", "calves"], sets: 4, reps: "4-5 each leg", tempo: "Max intent, soft landing", rest: "90 sec", videoId: "" },
    {
      name: "Box Jump to Single-Leg Landing",
      notes: "Jump onto a low box from two feet and land on one leg, holding the landing for 2 sec before stepping down. Use a low box until the landings are silent.",
      whyItMatters: "Teaches the body to absorb force on one leg, which is the exact position where knee and ankle injuries happen in sparring.",
      alternatives: [{ name: "Box Jump (two-foot landing)", reason: "Build up here first" }],
    },
    {
      name: "Kassespring med etbens-landing",
      notes: "Spring op på en lav kasse fra to fødder og land på ét ben. Hold landingen i 2 sek., før du træder ned. Brug en lav kasse, indtil landingerne er lydløse.",
      whyItMatters: "Lærer kroppen at optage kraft på ét ben — netop den position, hvor knæ- og ankelskader sker i sparring.",
      alternatives: [{ name: "Kassespring med tobens-landing", reason: "Byg op her først" }],
    },
    {
      name: "Lådhopp med enbenslandning",
      notes: "Hoppa upp på en låg låda från två fötter och landa på ett ben. Håll landningen i 2 sek innan du kliver ner.",
      whyItMatters: "Lär kroppen ta upp kraft på ett ben — precis där knä- och fotledsskador sker.",
      alternatives: [{ name: "Lådhopp med tvåbenslandning", reason: "Bygg upp här först" }],
    },
    {
      name: "Kassehopp med ettbenslanding",
      notes: "Hopp opp på en lav kasse fra to føtter og land på ett bein. Hold landingen i 2 sek før du går ned.",
      whyItMatters: "Lærer kroppen å ta opp kraft på ett bein — nettopp der kne- og ankelskader skjer.",
      alternatives: [{ name: "Kassehopp med tobeinslanding", reason: "Bygg opp her først" }],
    },
  ),

  pogoJumps: E(
    { id: "pogo-jumps-in-place", category: "plyometric", muscleGroups: ["calves", "quads", "core"], sets: 4, reps: "15-20", tempo: "Fast, stiff ankles", rest: "60 sec", videoId: "" },
    {
      name: "Pogo Jumps",
      notes: "Jump in place using mainly the ankles, knees almost straight and the body stiff like a spring. Aim for height with the shortest possible ground contact.",
      whyItMatters: "Builds ankle stiffness — the quality that turns a step into a bounce and makes footwork feel light.",
      alternatives: [{ name: "Skipping Rope (fast)", reason: "Same effect, easier on the calves" }],
    },
    {
      name: "Pogo-hop",
      notes: "Hop på stedet med anklerne som motor, næsten strakte knæ og en stiv krop som en fjeder. Sigt efter højde med kortest mulig kontakt med gulvet.",
      whyItMatters: "Bygger ankelstivhed — den egenskab, der gør et skridt til et bounce og får fodarbejdet til at føles let.",
      alternatives: [{ name: "Sjipning (hurtigt)", reason: "Samme effekt, mildere for lægge" }],
    },
    {
      name: "Pogohopp",
      notes: "Hoppa på stället med fotlederna som motor, nästan raka knän och stel kropp som en fjäder. Sikta på höjd med kortast möjliga marktid.",
      whyItMatters: "Bygger fotledsstyvhet — det som gör fotarbetet lätt.",
      alternatives: [{ name: "Hopprep (snabbt)", reason: "Samma effekt, snällare mot vaderna" }],
    },
    {
      name: "Pogohopp",
      notes: "Hopp på stedet med anklene som motor, nesten strake knær og stiv kropp som en fjær. Sikt på høyde med kortest mulig bakkekontakt.",
      whyItMatters: "Bygger ankelstivhet — det som gjør fotarbeidet lett.",
      alternatives: [{ name: "Hoppetau (raskt)", reason: "Samme effekt, mildere for leggene" }],
    },
  ),

  medBallSlam: E(
    { id: "med-ball-overhead-slam", category: "plyometric", muscleGroups: ["core", "shoulders", "back", "glutes"], sets: 4, reps: "6-8", tempo: "Max intent", rest: "60 sec", videoId: "" },
    {
      name: "Medicine Ball Overhead Slam",
      notes: "Reach the ball overhead with full extension, then slam it into the floor as hard as you can while the hips fold. Catch or pick it up and reset each rep.",
      whyItMatters: "A safe way to train maximum whole-body effort — the fast trunk flexion transfers directly to punching and downward kicks.",
      alternatives: [{ name: "Med Ball Rotational Throw", reason: "Rotational version of the same idea" }],
    },
    {
      name: "Medicinbold Slam",
      notes: "Stræk bolden helt op over hovedet og smadr den derefter ned i gulvet så hårdt du kan, mens hoften folder sammen. Saml bolden op og start forfra hver gentagelse.",
      whyItMatters: "En sikker måde at træne maksimal indsats med hele kroppen — den hurtige foldning i kroppen overføres direkte til slag og nedadgående spark.",
      alternatives: [{ name: "Medicinbold rotationskast", reason: "Rotationsversion af samme idé" }],
    },
    {
      name: "Medicinboll Slam",
      notes: "Sträck bollen högt över huvudet och slå ner den i golvet så hårt du kan medan höften viks. Plocka upp och börja om varje rep.",
      whyItMatters: "Ett säkert sätt att träna maximal helkroppsansträngning.",
      alternatives: [{ name: "Medicinboll rotationskast", reason: "Rotationsversion" }],
    },
    {
      name: "Medisinball Slam",
      notes: "Strekk ballen helt over hodet og slam den i gulvet så hardt du kan mens hoften folder seg. Plukk opp og start på nytt hver rep.",
      whyItMatters: "En trygg måte å trene maksimal helkroppsinnsats.",
      alternatives: [{ name: "Medisinball rotasjonskast", reason: "Rotasjonsversjon" }],
    },
  ),
};
