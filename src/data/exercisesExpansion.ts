// Expansion pack — ~45 additional exercises bringing the library to ~152 total.
// Same shape as exercisesAdditional.ts. EN/DA/SV/NO authored; DE+AR fall back to EN.

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

// Helper for entries where DA/SV/NO mirror EN closely (skill drills, generic names).
const ESame = (
  meta: Omit<Base, "en" | "da" | "sv" | "de" | "ar" | "no">,
  en: L,
): Base => ({ ...meta, en, da: en, sv: en, no: en, de: en, ar: en });

export const exercisesExpansion: Record<string, Base> = {

  // ───────────────────────── POWER (9) ─────────────────────────
  splitJerk: E(
    { id: "split-jerk", category: "power", muscleGroups: ["shoulders", "quads", "glutes", "core"], sets: 4, reps: "2-3", tempo: "Max intent", rest: "3 min", videoId: "0Y90Tg-rUTk" },
    { name: "Split Jerk", notes: "Aggressive dip-drive, punch under bar into split. Front shin vertical, back knee soft.", whyItMatters: "Trains full-body explosive overhead drive — the same coordination as launching a jumping back-kick.", alternatives: [{ name: "Push Jerk", reason: "Simpler footwork variant" }] },
    { name: "Split Jerk", notes: "Aggressivt dip-drive, slå dig under stangen i split. Forreste skinneben lodret, bagerste knæ blødt.", whyItMatters: "Træner helkrops eksplosivt overhead-drev — samme koordination som ved et springende baglænsspark.", alternatives: [{ name: "Push Jerk", reason: "Enklere fodvariant" }] },
    { name: "Split Jerk", notes: "Aggressiv dipp-driv, slå dig under stången i split. Främre skenben lodrätt, bakre knä mjukt.", whyItMatters: "Tränar helkropps explosiv överhead-driv — samma koordination som ett hoppande bakspark.", alternatives: [{ name: "Push Jerk", reason: "Enklare fotvariant" }] },
    { name: "Split Jerk", notes: "Aggressivt dip-driv, slå deg under stangen i split. Fremre skinnebein loddrett, bakre kne mykt.", whyItMatters: "Trener helkropps eksplosiv overhead-driv — samme koordinasjon som hoppende bakspark.", alternatives: [{ name: "Push Jerk", reason: "Enklere fotvariant" }] },
  ),
  trapBarJump: E(
    { id: "trap-bar-jump", category: "power", muscleGroups: ["quads", "glutes", "calves"], sets: 5, reps: "3", tempo: "Max velocity", rest: "2 min", videoId: "ksTgalqQYE0" },
    { name: "Trap Bar Jump", notes: "Load 20-30% of trap-bar deadlift 1RM. Triple-extend and jump. Soft landing, reset each rep.", whyItMatters: "Bridges max strength and pure plyometrics with a safer spine angle — directly boosts vertical and kick height.", alternatives: [{ name: "Dumbbell Jump Squat", reason: "If no trap bar available" }] },
    { name: "Trap Bar Hop", notes: "Belast 20-30% af trap-bar dødløft 1RM. Trippelekstension og hop. Blød landing, reset hver rep.", whyItMatters: "Bygger bro mellem maks-styrke og ren plyometrik med sikrere rygvinkel — øger direkte vertikal og sparkhøjde.", alternatives: [{ name: "Dumbbell Jump Squat", reason: "Hvis ingen trap bar er tilgængelig" }] },
    { name: "Trap Bar Hopp", notes: "Belasta 20-30% av trap-bar marklyft 1RM. Trippelextension och hopp. Mjuk landning, reset varje rep.", whyItMatters: "Bryggar maxstyrka och ren plyometri med säkrare ryggvinkel — höjer direkt vertikal och sparkhöjd.", alternatives: [{ name: "Dumbbell Jump Squat", reason: "Om ingen trap bar finns" }] },
    { name: "Trap Bar Hopp", notes: "Belast 20-30% av trap-bar markløft 1RM. Trippelekstensjon og hopp. Myk landing, reset hver rep.", whyItMatters: "Bygger bro mellom maksstyrke og ren plyometri med tryggere ryggvinkel — øker direkte vertikal og sparkhøyde.", alternatives: [{ name: "Dumbbell Jump Squat", reason: "Hvis ingen trap bar er tilgjengelig" }] },
  ),
  hangSnatch: E(
    { id: "hang-snatch", category: "power", muscleGroups: ["glutes", "hamstrings", "shoulders", "back"], sets: 5, reps: "2", tempo: "Max intent", rest: "2-3 min", videoId: "qPg42rZE7zQ" },
    { name: "Hang Snatch", notes: "From mid-thigh, explosive triple-extension into overhead catch. Drop bar if catch breaks.", whyItMatters: "Highest-velocity barbell lift — develops the whip-like hip extension that powers spinning kicks.", alternatives: [{ name: "Hang Power Clean", reason: "Lower technique threshold" }, { name: "Kettlebell Swing", reason: "No barbell needed" }] },
    { name: "Hang Snatch", notes: "Fra midt-lår, eksplosiv trippelekstension til over hovedet. Drop stangen hvis fangst brydes.", whyItMatters: "Vægtstangsløftet med højest hastighed — udvikler den piske-lignende hofteekstension der driver spinspark.", alternatives: [{ name: "Hang Power Clean", reason: "Lavere teknikkrav" }, { name: "Kettlebell Swing", reason: "Ingen vægtstang nødvendig" }] },
    { name: "Hangande Ryck", notes: "Från mittlår, explosiv trippelextension till över huvudet. Släpp stången om fång bryts.", whyItMatters: "Snabbaste skivstångslyftet — utvecklar den pisksnärt-lika höftextensionen som driver snurrsparkar.", alternatives: [{ name: "Hang Power Clean", reason: "Lägre teknikkrav" }, { name: "Kettlebell Swing", reason: "Ingen skivstång behövs" }] },
    { name: "Hang Snatch", notes: "Fra midt-lår, eksplosiv trippelekstensjon til over hodet. Slipp stangen hvis fangsten brytes.", whyItMatters: "Vektstangsløftet med høyest hastighet — utvikler det pisklignende hoftesnappet som driver spinnspark.", alternatives: [{ name: "Hang Power Clean", reason: "Lavere teknikkrav" }, { name: "Kettlebell Swing", reason: "Ingen vektstang nødvendig" }] },
  ),
  bandedKettlebellSwing: E(
    { id: "banded-kb-swing", category: "power", muscleGroups: ["glutes", "hamstrings", "core"], sets: 4, reps: "8", tempo: "Explosive snap", rest: "60 sec", videoId: "Yc8Y5_ezi3w" },
    { name: "Banded Kettlebell Swing", notes: "Anchor band to floor; attaches to kettlebell. Snap hips, project bell forward — let band accelerate it down.", whyItMatters: "Adds accommodating resistance to the hip-snap, overloading the eccentric — the exact action of decelerating after a fast kick.", alternatives: [{ name: "Heavy KB Swing", reason: "Same pattern without band" }] },
    { name: "Banded Kettlebell Swing", notes: "Forankr elastik til gulv; fastgør til kettlebell. Snap hofter, før bell frem — lad elastikken accelerere den ned.", whyItMatters: "Tilføjer akkommoderende modstand til hoftesnap, overloader excentrisk — netop handlingen ved at decelerere efter et hurtigt spark.", alternatives: [{ name: "Tung KB Swing", reason: "Samme mønster uden elastik" }] },
    { name: "Banded Kettlebell Swing", notes: "Förankra band i golvet; fäst i kettlebell. Snäpp höfter, för bell framåt — låt bandet accelerera den ner.", whyItMatters: "Adderar ackommoderande motstånd till höftsnapp, överbelastar excentriskt — exakt handlingen att decelerera efter snabb spark.", alternatives: [{ name: "Tung KB Swing", reason: "Samma mönster utan band" }] },
    { name: "Banded Kettlebell Swing", notes: "Forankre strikk i gulv; fest til kettlebell. Snapp hofter, før bell frem — la strikken akselerere den ned.", whyItMatters: "Legger akkommoderende motstand til hoftesnapp, overlader eksentrisk — akkurat handlingen ved å desellerere etter et raskt spark.", alternatives: [{ name: "Tung KB Swing", reason: "Samme mønster uten strikk" }] },
  ),
  cleanHighPull: E(
    { id: "clean-high-pull", category: "power", muscleGroups: ["back", "glutes", "hamstrings", "shoulders"], sets: 4, reps: "3", tempo: "Max intent", rest: "2 min", videoId: "9q9bC0Wpw_8" },
    { name: "Clean High Pull", notes: "Pull bar to chest height with violent triple-extension. Elbows high, no catch.", whyItMatters: "Develops posterior-chain RFD without the wrist demands of a full clean — perfect bridge lift.", alternatives: [{ name: "Power Clean", reason: "Adds catch element" }] },
    { name: "Clean High Pull", notes: "Træk stangen til brysthøjde med voldsom trippelekstension. Høje albuer, ingen fangst.", whyItMatters: "Udvikler baglinje-RFD uden de håndledskrav som fuld clean har — perfekt brolift.", alternatives: [{ name: "Power Clean", reason: "Tilføjer fangst-element" }] },
    { name: "Frivändning Högdrag", notes: "Dra stången till brösthöjd med våldsam trippelextension. Höga armbågar, inget fång.", whyItMatters: "Utvecklar bakkedjans RFD utan handledskraven från full frivändning — perfekt brygglyft.", alternatives: [{ name: "Power Clean", reason: "Lägger till fång" }] },
    { name: "Clean Høytrekk", notes: "Trekk stangen til brysthøyde med voldsom trippelekstensjon. Høye albuer, ingen fangst.", whyItMatters: "Utvikler bakkjedens RFD uten håndleddskravene fra full clean — perfekt broløft.", alternatives: [{ name: "Power Clean", reason: "Legger til fangst" }] },
  ),
  pushJerkBehindNeck: ESame(
    { id: "push-jerk-bn", category: "power", muscleGroups: ["shoulders", "core", "quads"], sets: 4, reps: "3", rest: "2 min", videoId: "ynjItbDZdpw" },
    { name: "Behind-the-Neck Push Jerk", notes: "Bar racked behind neck. Aggressive dip-drive, punch under. Stop if shoulder mobility is limited.", whyItMatters: "Trains overhead drive with the torso vertical — same posture as throwing a fast guard-side punch.", alternatives: [{ name: "Front-Rack Push Jerk", reason: "Easier on shoulder mobility" }] },
  ),
  bandedBoxJump: E(
    { id: "banded-box-jump", category: "power", muscleGroups: ["quads", "glutes", "calves"], sets: 4, reps: "3", tempo: "Max velocity", rest: "90 sec", videoId: "" },
    { name: "Band-Resisted Box Jump", notes: "Band around hips, anchored to floor. Jump onto box. Band overloads concentric — step down between reps.", whyItMatters: "Forces aggressive hip extension against accommodating load — direct carryover to launching off the back leg.", alternatives: [{ name: "Box Jump", reason: "Same pattern without band" }] },
    { name: "Elastik-Modstand Box Jump", notes: "Elastik om hofter, forankret i gulv. Hop op på kasse. Elastikken overloader koncentrisk — træd ned mellem reps.", whyItMatters: "Tvinger aggressiv hofteekstension mod akkommoderende belastning — direkte overførsel til afskud fra bagben.", alternatives: [{ name: "Box Jump", reason: "Samme mønster uden elastik" }] },
    { name: "Band-Resisted Box Jump", notes: "Band runt höfter, förankrat i golvet. Hoppa upp på låda. Bandet överbelastar koncentriskt — kliv ner mellan reps.", whyItMatters: "Tvingar aggressiv höftextension mot ackommoderande last — direkt överföring till avskott från bakben.", alternatives: [{ name: "Box Jump", reason: "Samma mönster utan band" }] },
    { name: "Strikk-Motstand Box Jump", notes: "Strikk rundt hofter, forankret i gulv. Hopp opp på kasse. Strikken overlader konsentrisk — gå ned mellom reps.", whyItMatters: "Tvinger aggressiv hofteekstensjon mot akkommoderende last — direkte overføring til avskudd fra bakben.", alternatives: [{ name: "Box Jump", reason: "Samme mønster uten strikk" }] },
  ),
  rotationalMedBallScoop: E(
    { id: "rot-med-ball-scoop", category: "power", muscleGroups: ["core", "glutes", "shoulders"], sets: 4, reps: "5 each side", tempo: "Max intent", rest: "60 sec", videoId: "z2_dxBl3KEM" },
    { name: "Rotational Med Ball Scoop Toss", notes: "Stand side-on to wall. Scoop med ball low, throw up-and-across as high as possible. Full hip turn.", whyItMatters: "Trains diagonal hip-to-shoulder power transfer — the exact chain in a spinning back-kick or hook punch.", alternatives: [{ name: "Standing Med Ball Slam", reason: "Vertical variant" }] },
    { name: "Rotations-Medbold Scoop Kast", notes: "Stå sidevendt mod væg. Scoop bold lavt, kast op-og-tværs så højt som muligt. Fuld hoftedrejning.", whyItMatters: "Træner diagonal hofte-til-skulder kraftoverførsel — netop kæden i et baglænsspark eller hookspark.", alternatives: [{ name: "Stående Medbold Slam", reason: "Vertikal variant" }] },
    { name: "Rotations-Medboll Scoop", notes: "Stå sidledes mot vägg. Scoopa boll lågt, kasta upp-och-tvärs så högt som möjligt. Full höftvridning.", whyItMatters: "Tränar diagonal höft-till-axel kraftöverföring — exakt kedjan i en snurrspark eller hook.", alternatives: [{ name: "Stående Medboll Slam", reason: "Vertikal variant" }] },
    { name: "Rotasjons-Medball Scoop Kast", notes: "Stå sidevendt mot vegg. Scoop ball lavt, kast opp-og-tvers så høyt som mulig. Full hoftedreining.", whyItMatters: "Trener diagonal hofte-til-skulder kraftoverføring — akkurat kjeden i et bakspark eller hookspark.", alternatives: [{ name: "Stående Medball Slam", reason: "Vertikal variant" }] },
  ),
  zercherSquat: E(
    { id: "zercher-squat", category: "power", muscleGroups: ["quads", "glutes", "core", "back"], sets: 4, reps: "5", tempo: "2-0-X-0", rest: "2-3 min", videoId: "iVKDeWUYdRk" },
    { name: "Zercher Squat", notes: "Bar in crook of elbows. Brace hard, sit between hips. Stand explosively.", whyItMatters: "Front-loaded squat that demands brutal core bracing — translates to staying upright when absorbing a kick.", alternatives: [{ name: "Goblet Squat", reason: "Lower technical demand" }, { name: "Front Squat", reason: "Same upright pattern" }] },
    { name: "Zercher Squat", notes: "Stang i albuekrog. Spænd hårdt op, sæt dig mellem hofterne. Rejs dig eksplosivt.", whyItMatters: "Front-belastet squat der kræver brutal kerne-spænding — overføres til at blive oprejst når man absorberer et spark.", alternatives: [{ name: "Goblet Squat", reason: "Lavere teknikkrav" }, { name: "Front Squat", reason: "Samme oprejste mønster" }] },
    { name: "Zercher Knäböj", notes: "Stång i armbågsvecket. Spänn hårt, sätt dig mellan höfter. Res dig explosivt.", whyItMatters: "Frontladdat knäböj som kräver brutal bål-stagning — överförs till att stå upprätt vid sparkmottagning.", alternatives: [{ name: "Goblet Squat", reason: "Lägre teknikkrav" }, { name: "Front Squat", reason: "Samma upprätta mönster" }] },
    { name: "Zercher Knebøy", notes: "Stang i albuekrok. Spenn hardt opp, sett deg mellom hofter. Reis deg eksplosivt.", whyItMatters: "Frontbelastet knebøy som krever brutal kjernestagning — overføres til å bli oppreist når du absorberer et spark.", alternatives: [{ name: "Goblet Squat", reason: "Lavere teknikkrav" }, { name: "Front Squat", reason: "Samme oppreiste mønster" }] },
  ),

  // ───────────────────────── PLYOMETRIC (10) ─────────────────────────
  hurdleHopBilateral: E(
    { id: "hurdle-hop-bi", category: "plyometric", muscleGroups: ["calves", "quads", "glutes"], sets: 4, reps: "5 hurdles", tempo: "Min contact", rest: "90 sec", videoId: "9HoMP3aUaWE" },
    { name: "Bilateral Hurdle Hops", notes: "Hop over 5 mini hurdles, both feet. Stay stiff, minimize ground contact. Knees over toes.", whyItMatters: "Builds reactive ankle/calf stiffness — the spring that gives push-kicks their snap.", alternatives: [{ name: "Pogo Jumps", reason: "Same reactive demand, no equipment" }] },
    { name: "Bilateral Hækkehop", notes: "Hop over 5 mini hække, begge fødder. Stiv hold, minimér jordkontakt. Knæ over tæer.", whyItMatters: "Opbygger reaktiv ankel-/læg-stivhed — fjederen der giver push-spark deres snap.", alternatives: [{ name: "Pogo Jumps", reason: "Samme reaktive krav uden udstyr" }] },
    { name: "Bilateral Häckhopp", notes: "Hoppa över 5 minihäckar, båda fötter. Stelt hold, minimera markkontakt. Knän över tår.", whyItMatters: "Bygger reaktiv vrist-/vad-stelhet — fjädern som ger push-sparkar sin snärt.", alternatives: [{ name: "Pogo Jumps", reason: "Samma reaktiva krav utan utrustning" }] },
    { name: "Bilateral Hekkehopp", notes: "Hopp over 5 minihekker, begge føtter. Stivt hold, minimer bakkekontakt. Knær over tær.", whyItMatters: "Bygger reaktiv ankel-/leggstivhet — fjæren som gir push-spark sitt snapp.", alternatives: [{ name: "Pogo Jumps", reason: "Samme reaktive krav uten utstyr" }] },
  ),
  hurdleHopUnilateral: E(
    { id: "hurdle-hop-uni", category: "plyometric", muscleGroups: ["calves", "quads", "glutes"], sets: 3, reps: "4 each leg", tempo: "Min contact", rest: "90 sec", videoId: "WBNCthd2cFE" },
    { name: "Single-Leg Hurdle Hops", notes: "Hop over 4 mini hurdles on one leg. Stable landing, immediate rebound.", whyItMatters: "Single-leg reactive strength is the strongest predictor of kick speed and ankle resilience.", alternatives: [{ name: "Single-Leg Pogos", reason: "No hurdles needed" }] },
    { name: "Ét-Bens Hækkehop", notes: "Hop over 4 mini hække på ét ben. Stabil landing, øjeblikkelig rebound.", whyItMatters: "Ét-bens reaktiv styrke er den stærkeste prædiktor for sparkhastighed og ankelmodstand.", alternatives: [{ name: "Ét-Bens Pogos", reason: "Ingen hække nødvendige" }] },
    { name: "Enbens Häckhopp", notes: "Hoppa över 4 minihäckar på ett ben. Stabil landning, omedelbar rebound.", whyItMatters: "Enbens reaktiv styrka är starkaste prediktorn för sparkhastighet och vristmotstånd.", alternatives: [{ name: "Enbens Pogos", reason: "Inga häckar behövs" }] },
    { name: "Énbens Hekkehopp", notes: "Hopp over 4 minihekker på ett bein. Stabil landing, umiddelbar rebound.", whyItMatters: "Énbens reaktiv styrke er sterkeste prediktor for sparkhastighet og ankelmotstand.", alternatives: [{ name: "Énbens Pogos", reason: "Ingen hekker nødvendig" }] },
  ),
  altLungeJump: E(
    { id: "alt-lunge-jump", category: "plyometric", muscleGroups: ["quads", "glutes", "calves"], sets: 4, reps: "8 total", tempo: "Explosive", rest: "75 sec", videoId: "fl9TJpKmiSY" },
    { name: "Alternating Lunge Jump", notes: "Jump from lunge, switch legs mid-air, land soft in opposite lunge. Maintain torso upright.", whyItMatters: "Trains the split-stance power and coordination used in switching guard between kicks.", alternatives: [{ name: "Split Squat", reason: "Non-plyometric strength version" }] },
    { name: "Skiftende Udfaldshop", notes: "Hop fra udfald, skift ben i luften, land blødt i modsat udfald. Hold overkrop oprejst.", whyItMatters: "Træner split-stance kraft og koordination som bruges ved at skifte garde mellem spark.", alternatives: [{ name: "Split Squat", reason: "Ikke-plyometrisk styrkeversion" }] },
    { name: "Växlande Utfallshopp", notes: "Hoppa från utfall, växla ben i luften, landa mjukt i motsatt utfall. Håll bål upprätt.", whyItMatters: "Tränar split-stance kraft och koordination som används vid byte av garde mellan sparkar.", alternatives: [{ name: "Split Squat", reason: "Icke-plyometrisk styrkeversion" }] },
    { name: "Vekslende Utfallshopp", notes: "Hopp fra utfall, veksle bein i luften, land mykt i motsatt utfall. Hold overkropp oppreist.", whyItMatters: "Trener split-stance kraft og koordinasjon som brukes ved bytte av garde mellom spark.", alternatives: [{ name: "Split Squat", reason: "Ikke-plyometrisk styrkeversion" }] },
  ),
  broadJumpToSprint: ESame(
    { id: "broad-jump-sprint", category: "plyometric", muscleGroups: ["glutes", "quads", "calves"], sets: 5, reps: "1 jump + 10 m", rest: "2 min", videoId: "" },
    { name: "Broad Jump → Sprint", notes: "Stick the broad jump landing, then sprint 10 m. Trains horizontal force then conversion to top speed.", whyItMatters: "Mirrors closing distance: explode forward then accelerate — the bread-and-butter of attacking footwork.", alternatives: [{ name: "Broad Jump", reason: "Without the sprint conversion" }] },
  ),
  depthDrop: E(
    { id: "depth-drop", category: "plyometric", muscleGroups: ["quads", "calves", "core"], sets: 4, reps: "5", tempo: "Stick landing", rest: "60 sec", videoId: "qoCQRkN6XEU" },
    { name: "Depth Drop", notes: "Step (don't jump) off 30-50 cm box. Land soft on balls of feet, knees aligned, immediate stop.", whyItMatters: "Teaches landing mechanics before adding rebound — protects knees and ankles from spar-day impacts.", alternatives: [{ name: "Box Step-Down", reason: "Even lower intensity" }] },
    { name: "Drop-Landing", notes: "Træd (ikke hop) ned fra 30-50 cm kasse. Land blødt på fodballer, knæ alignet, øjeblikkeligt stop.", whyItMatters: "Lærer landingsmekanik før rebound — beskytter knæ og ankler mod sparring-dagsbelastninger.", alternatives: [{ name: "Box Step-Down", reason: "Endnu lavere intensitet" }] },
    { name: "Drop-Landning", notes: "Kliv (inte hoppa) ner från 30-50 cm låda. Landa mjukt på fotballar, knän alignade, omedelbart stopp.", whyItMatters: "Lär landningsmekanik före rebound — skyddar knän och vrister mot sparringdagsbelastningar.", alternatives: [{ name: "Box Step-Down", reason: "Ännu lägre intensitet" }] },
    { name: "Drop-Landing", notes: "Tre (ikke hopp) ned fra 30-50 cm kasse. Land mykt på fotballer, knær justert, umiddelbart stopp.", whyItMatters: "Lærer landingsmekanikk før rebound — beskytter knær og ankler mot sparringdagsbelastninger.", alternatives: [{ name: "Box Step-Down", reason: "Enda lavere intensitet" }] },
  ),
  scissorJump: ESame(
    { id: "scissor-jump", category: "plyometric", muscleGroups: ["quads", "glutes", "hip-flexors"], sets: 4, reps: "6 total", rest: "75 sec", videoId: "" },
    { name: "Scissor Jump", notes: "Start in split stance. Jump high, switch legs scissoring mid-air. Land in opposite split. Soft, fast.", whyItMatters: "Trains the in-air hip switch — same coordination as a switch-kick.", alternatives: [{ name: "Alternating Lunge Jump", reason: "Lower amplitude variant" }] },
  ),
  tuckJump: E(
    { id: "tuck-jump", category: "plyometric", muscleGroups: ["quads", "core", "hip-flexors"], sets: 4, reps: "5", tempo: "Max height", rest: "75 sec", videoId: "rcKTw6jOAH8" },
    { name: "Tuck Jump", notes: "Jump vertically, pull knees to chest mid-air. Soft, immediate rebound or full reset depending on focus.", whyItMatters: "Combines vertical power with hip-flexor recruitment — translates to fast knee-lift for chamber phase of kicks.", alternatives: [{ name: "Knee Tuck Pogos", reason: "Lower amplitude" }] },
    { name: "Tuck Jump", notes: "Hop lodret, træk knæ til bryst i luften. Blød, øjeblikkelig rebound eller fuld reset afhængig af fokus.", whyItMatters: "Kombinerer vertikal kraft med hofteflexor-rekruttering — overføres til hurtigt knæløft i chamber-fase af spark.", alternatives: [{ name: "Knæ-Tuck Pogos", reason: "Lavere amplitude" }] },
    { name: "Tuck-Hopp", notes: "Hoppa lodrätt, dra knän till bröst i luften. Mjuk, omedelbar rebound eller full reset beroende på fokus.", whyItMatters: "Kombinerar vertikal kraft med höftflexorrekrytering — överförs till snabbt knälyft i chamber-fas av spark.", alternatives: [{ name: "Knä-Tuck Pogos", reason: "Lägre amplitud" }] },
    { name: "Tuck-Hopp", notes: "Hopp loddrett, trekk knær til bryst i luften. Mykt, umiddelbar rebound eller full reset avhengig av fokus.", whyItMatters: "Kombinerer vertikal kraft med hofteflexorrekruttering — overføres til raskt knehev i chamber-fase av spark.", alternatives: [{ name: "Kne-Tuck Pogos", reason: "Lavere amplitude" }] },
  ),
  lateralBoundContinuous: ESame(
    { id: "lateral-bound-cont", category: "plyometric", muscleGroups: ["glutes", "quads", "calves"], sets: 4, reps: "6 each side", rest: "90 sec", videoId: "" },
    { name: "Continuous Lateral Bound", notes: "Side-to-side bounds, no pause between. Stick each landing for 1 second only, then rebound.", whyItMatters: "Trains lateral elasticity — the spring that lets you re-attack immediately after pivoting away.", alternatives: [{ name: "Skater Hops", reason: "Same lateral pattern" }] },
  ),
  pogoHopForward: ESame(
    { id: "pogo-forward", category: "plyometric", muscleGroups: ["calves", "quads"], sets: 3, reps: "10 m", rest: "60 sec", videoId: "" },
    { name: "Forward Pogo Hops", notes: "Stiff-leg pogo hops moving forward 10 m. Knees barely bend. All ankle.", whyItMatters: "Isolates ankle-stiffness — the foundation of efficient kicking and quick steps.", alternatives: [{ name: "Pogo Hops in Place", reason: "Stationary version" }] },
  ),
  drop90Rotation: ESame(
    { id: "drop-90-rotation", category: "plyometric", muscleGroups: ["calves", "glutes", "core"], sets: 4, reps: "4 each side", rest: "75 sec", videoId: "" },
    { name: "Depth Drop + 90° Rotation", notes: "Drop from box, on landing immediately rotate 90° and stick. Alternate direction.", whyItMatters: "Trains landing + reactive rotation — needed for spinning kicks and post-kick recovery.", alternatives: [{ name: "Depth Drop", reason: "Without rotation" }] },
  ),

  // ───────────────────────── SPEED (9) ─────────────────────────
  flyingTwentyMeter: ESame(
    { id: "flying-20m", category: "speed", muscleGroups: ["glutes", "hamstrings", "calves"], sets: 4, reps: "1 sprint", rest: "3 min", videoId: "" },
    { name: "Flying 20 m Sprint", notes: "10 m build-up, then 20 m flat-out. Focus on top-end speed mechanics. Full recovery between.", whyItMatters: "Direct test and trainer of max speed — top-end velocity ceiling raises every other speed quality.", alternatives: [{ name: "30 m Sprint from blocks", reason: "Accel-dominant variant" }] },
  ),
  resistedSled: E(
    { id: "resisted-sled", category: "speed", muscleGroups: ["glutes", "hamstrings", "quads"], sets: 5, reps: "20 m", tempo: "Max intent", rest: "2 min", videoId: "JT38PSx1Yog" },
    { name: "Resisted Sled Sprint", notes: "Light load (10-20% bodyweight). Aggressive forward lean, drive feet down-and-back. Don't shorten stride.", whyItMatters: "Overloads horizontal force production — the engine of attacking footwork and quick gap-closing.", alternatives: [{ name: "Hill Sprint", reason: "No sled needed, same horizontal force focus" }] },
    { name: "Modstand Sled Sprint", notes: "Let belastning (10-20% kropsvægt). Aggressiv fremlæn, driv fødder ned-og-tilbage. Forkort ikke skridt.", whyItMatters: "Overloader horisontal kraftproduktion — motoren bag angribende fodarbejde og hurtig distance-lukning.", alternatives: [{ name: "Bakke-Sprint", reason: "Ingen sled nødvendig, samme horisontale kraftfokus" }] },
    { name: "Motstånds-Sled Sprint", notes: "Lätt last (10-20% kroppsvikt). Aggressiv framlut, driv fötter ner-och-bakåt. Förkorta inte steget.", whyItMatters: "Överbelastar horisontell kraftproduktion — motorn bakom angripande fotarbete och snabb distansstängning.", alternatives: [{ name: "Backsprint", reason: "Ingen sled behövs, samma horisontella kraftfokus" }] },
    { name: "Motstand Sled Sprint", notes: "Lett last (10-20% kroppsvekt). Aggressiv framlent, driv føtter ned-og-bakover. Forkort ikke skritt.", whyItMatters: "Overlader horisontal kraftproduksjon — motoren bak angripende fotarbeid og rask distansestenging.", alternatives: [{ name: "Bakkesprint", reason: "Ingen sled nødvendig, samme horisontale kraftfokus" }] },
  ),
  assistedSprint: ESame(
    { id: "assisted-sprint", category: "speed", muscleGroups: ["hamstrings", "glutes", "calves"], sets: 4, reps: "20 m", rest: "2-3 min", videoId: "" },
    { name: "Overspeed Assisted Sprint", notes: "Light bungee pull or downhill (1-2°). Sprint at supramaximal velocity. Stay relaxed.", whyItMatters: "Forces the CNS to fire at faster-than-normal frequencies — raises stride-rate ceiling.", alternatives: [{ name: "Downhill Sprint", reason: "Same overspeed effect without partner" }] },
  ),
  shadowKick1v1: ESame(
    { id: "shadow-kick-1v1", category: "speed", muscleGroups: ["hip-flexors", "glutes", "core"], sets: 6, reps: "20 sec", rest: "40 sec", videoId: "" },
    { name: "Shadow Kicking 1-on-1 Mirror", notes: "Face partner; one leads with random kicks, other mirrors as fast as possible. Both at 70% effort, full speed reactions.", whyItMatters: "Trains visual-reaction kick selection — the hardest skill to build in static drills.", alternatives: [{ name: "Solo Shadow Kicking", reason: "No partner needed" }] },
  ),
  cuedLineDrill: ESame(
    { id: "cued-line-drill", category: "speed", muscleGroups: ["calves", "quads", "glutes"], sets: 6, reps: "10 sec", rest: "30 sec", videoId: "" },
    { name: "Cued Forward/Back Line Drill", notes: "Stand on line. Coach calls 'forward' or 'back' randomly — sprint 2 m in that direction, reset. Fast as possible.", whyItMatters: "Trains rapid decision-and-execute footwork against unpredictable cues.", alternatives: [{ name: "Mirror Shuffle", reason: "Lateral version" }] },
  ),
  ballDropReaction: ESame(
    { id: "ball-drop-react", category: "speed", muscleGroups: ["calves", "quads"], sets: 6, reps: "1 catch", rest: "45 sec", videoId: "" },
    { name: "Ball Drop Reaction Sprint", notes: "Partner holds tennis ball at shoulder height 2-3 m ahead. Drop unannounced — sprint and catch before second bounce.", whyItMatters: "Pure visual reaction + acceleration — closest gym drill to reading an opponent's commitment.", alternatives: [{ name: "Reactive Touchdown Sprint", reason: "Audio-cued version" }] },
  ),
  bandedKickSpeed: ESame(
    { id: "banded-kick-speed", category: "speed", muscleGroups: ["hip-flexors", "glutes", "core"], sets: 4, reps: "10 each leg", rest: "60 sec", videoId: "" },
    { name: "Banded Front-Leg Kick Speed", notes: "Light band around lead-leg ankle, anchored behind. Snap fast front kicks — band assists return phase. Quality reps only.", whyItMatters: "Overspeed for kicking specifically — raises ceiling of kick frequency under fatigue.", alternatives: [{ name: "Hand-Held Pad Speed Kicks", reason: "Real target, slightly slower" }] },
  ),
  splitStanceReact: ESame(
    { id: "split-stance-react", category: "speed", muscleGroups: ["glutes", "calves", "core"], sets: 5, reps: "5 cues", rest: "60 sec", videoId: "" },
    { name: "Split-Stance Reactive Switch", notes: "Standing in fighting stance, on cue switch lead leg as fast as possible. 5 switches per set.", whyItMatters: "Trains the fastest possible switch-step — opens or closes scoring angles in a single beat.", alternatives: [{ name: "Switch Kick Shadow", reason: "Adds kick after switch" }] },
  ),
  laddreInOutQuick: ESame(
    { id: "ladder-in-out", category: "speed", muscleGroups: ["calves", "quads"], sets: 4, reps: "1 ladder", rest: "60 sec", videoId: "" },
    { name: "Ladder In-Out Quick Feet", notes: "Run through agility ladder with in-in-out-out pattern. Quiet, fast. Eyes forward.", whyItMatters: "Coordinates fast foot patterns under cognitive load — directly transfers to broken footwork rhythms in sparring.", alternatives: [{ name: "Ladder Ickey Shuffle", reason: "Alternative pattern" }] },
  ),

  // ───────────────────────── STRENGTH (10) ─────────────────────────
  bulgarianSplitSquat: E(
    { id: "bulgarian-split-sq", category: "strength", muscleGroups: ["quads", "glutes", "core"], sets: 4, reps: "8 each leg", tempo: "3-1-1-0", rest: "75 sec", videoId: "2C-uNgKwPLE" },
    { name: "Bulgarian Split Squat", notes: "Rear foot elevated. Front shin vertical at bottom. Drive through front heel.", whyItMatters: "Best single-leg strength builder — corrects asymmetries between kicking and base legs.", alternatives: [{ name: "Reverse Lunge", reason: "Lower balance demand" }] },
    { name: "Bulgarian Split Squat", notes: "Bagerste fod hævet. Forreste skinneben lodret i bund. Driv gennem forreste hæl.", whyItMatters: "Bedste ét-bens styrke-bygger — korrigerer asymmetri mellem spark- og base-ben.", alternatives: [{ name: "Reverse Lunge", reason: "Lavere balancekrav" }] },
    { name: "Bulgarisk Knäböj", notes: "Bakre fot upphöjd. Främre skenben lodrätt i botten. Driv genom främre häl.", whyItMatters: "Bästa enbens styrkbyggare — korrigerar asymmetri mellan spark- och basben.", alternatives: [{ name: "Reverse Lunge", reason: "Lägre balanskrav" }] },
    { name: "Bulgarsk Knebøy", notes: "Bakre fot hevet. Fremre skinnebein loddrett i bunn. Driv gjennom fremre hæl.", whyItMatters: "Beste énbens styrkebygger — korrigerer asymmetri mellom spark- og basebein.", alternatives: [{ name: "Reverse Lunge", reason: "Lavere balansekrav" }] },
  ),
  rdl: E(
    { id: "rdl", category: "strength", muscleGroups: ["hamstrings", "glutes", "back"], sets: 4, reps: "6-8", tempo: "3-1-1-0", rest: "90 sec", videoId: "7j0PGyL3kKE" },
    { name: "Romanian Deadlift", notes: "Hinge at hips, soft knees, bar tracks close to legs. Feel hamstring stretch — don't round back.", whyItMatters: "Builds hamstring strength + hip-hinge pattern that protects knees in landing and decelerating kicks.", alternatives: [{ name: "Single-Leg RDL", reason: "Adds balance demand" }] },
    { name: "Rumænsk Dødløft", notes: "Hængsl i hofter, bløde knæ, stang glider tæt på ben. Mærk hamstring-stræk — rund ikke ryggen.", whyItMatters: "Opbygger hamstring-styrke + hofte-hængsel mønster der beskytter knæ ved landing og deceleration af spark.", alternatives: [{ name: "Ét-Bens RDL", reason: "Tilføjer balancekrav" }] },
    { name: "Rumänsk Marklyft", notes: "Gångjärn i höfter, mjuka knän, stång glider nära ben. Känn hamstring-stretch — runda inte ryggen.", whyItMatters: "Bygger hamstring-styrka + höft-gångjärn mönster som skyddar knän vid landning och deceleration av spark.", alternatives: [{ name: "Enbens RDL", reason: "Lägger till balanskrav" }] },
    { name: "Rumensk Markløft", notes: "Hengsle i hofter, myke knær, stang glir nær bein. Føl hamstring-strekk — rund ikke ryggen.", whyItMatters: "Bygger hamstring-styrke + hofte-hengsel mønster som beskytter knær ved landing og deselerasjon av spark.", alternatives: [{ name: "Énbens RDL", reason: "Legger til balansekrav" }] },
  ),
  hipThrust: E(
    { id: "hip-thrust", category: "strength", muscleGroups: ["glutes", "hamstrings", "core"], sets: 4, reps: "8", tempo: "2-1-X-1", rest: "90 sec", videoId: "LM8XHLYJoYs" },
    { name: "Barbell Hip Thrust", notes: "Shoulders on bench, bar across hips. Drive hips up, squeeze glutes hard at top. Chin tucked.", whyItMatters: "Isolated glute strength — the prime mover of every kick and push-off.", alternatives: [{ name: "Glute Bridge", reason: "Bodyweight version" }, { name: "Single-Leg Hip Thrust", reason: "Unilateral variant" }] },
    { name: "Vægtstang Hip Thrust", notes: "Skuldre på bænk, stang over hofter. Driv hofter op, knib balder hårdt i top. Hagen ind.", whyItMatters: "Isoleret balde-styrke — primær motor i hvert spark og afsæt.", alternatives: [{ name: "Glute Bridge", reason: "Kropsvægts-version" }, { name: "Ét-Bens Hip Thrust", reason: "Unilateral variant" }] },
    { name: "Skivstångs Hip Thrust", notes: "Axlar på bänk, stång över höfter. Driv höfter upp, knip rumpa hårt i toppen. Haka in.", whyItMatters: "Isolerad gluteus-styrka — primärmotor i varje spark och avstamp.", alternatives: [{ name: "Glute Bridge", reason: "Kroppsviktsversion" }, { name: "Enbens Hip Thrust", reason: "Unilateral variant" }] },
    { name: "Vektstang Hip Thrust", notes: "Skuldre på benk, stang over hofter. Driv hofter opp, klem rumpe hardt i topp. Hake inn.", whyItMatters: "Isolert glutes-styrke — primærmotor i hvert spark og avskudd.", alternatives: [{ name: "Glute Bridge", reason: "Kroppsvektsversjon" }, { name: "Énbens Hip Thrust", reason: "Unilateral variant" }] },
  ),
  pullUp: E(
    { id: "pull-up", category: "strength", muscleGroups: ["back", "shoulders", "core"], sets: 4, reps: "5-8", tempo: "2-1-X-1", rest: "90 sec", videoId: "eGo4IYlbE5g" },
    { name: "Pull-Up", notes: "Dead hang start, chin clearly over bar. Control descent. Add load when 8 clean reps achievable.", whyItMatters: "Builds the pulling strength that anchors the upper body during arm-swing in kicks and clinch defense.", alternatives: [{ name: "Lat Pulldown", reason: "Scaled version for building up" }, { name: "Inverted Row", reason: "Horizontal pulling alternative" }] },
    { name: "Pull-Up", notes: "Død-hæng start, hage tydeligt over stang. Kontrolleret nedgang. Tilføj vægt når 8 rene reps er muligt.", whyItMatters: "Opbygger den trækstyrke der forankrer overkroppen under armsving i spark og clinch-forsvar.", alternatives: [{ name: "Lat Pulldown", reason: "Skaleret version for opbygning" }, { name: "Inverted Row", reason: "Horisontalt træk-alternativ" }] },
    { name: "Chins", notes: "Dödhäng start, haka tydligt över stång. Kontrollerad nedgång. Lägg till vikt när 8 rena reps är möjligt.", whyItMatters: "Bygger dragstyrkan som förankrar överkroppen under armsving i spark och clinch-försvar.", alternatives: [{ name: "Lat Pulldown", reason: "Skalad version för uppbyggnad" }, { name: "Inverted Row", reason: "Horisontellt dragalternativ" }] },
    { name: "Pull-Up", notes: "Død-heng start, hake tydelig over stang. Kontrollert nedgang. Legg til vekt når 8 rene reps er mulig.", whyItMatters: "Bygger trekkstyrken som forankrer overkroppen under armsving i spark og clinch-forsvar.", alternatives: [{ name: "Lat Pulldown", reason: "Skalert versjon for oppbygging" }, { name: "Inverted Row", reason: "Horisontalt trekkalternativ" }] },
  ),
  benchPress: E(
    { id: "bench-press", category: "strength", muscleGroups: ["chest", "shoulders"], sets: 4, reps: "5-8", tempo: "2-1-X-1", rest: "90 sec", videoId: "rT7DgCr-3pg" },
    { name: "Barbell Bench Press", notes: "Feet planted, slight arch, bar to mid-chest. Drive heels and press explosively.", whyItMatters: "General upper-body strength reservoir — supports clinch frame and counter-balance during high kicks.", alternatives: [{ name: "Dumbbell Bench Press", reason: "Larger range of motion" }, { name: "Push-Up", reason: "No equipment needed" }] },
    { name: "Bænkpres", notes: "Fødder plantet, let bue, stang til midt-bryst. Driv hæle og pres eksplosivt.", whyItMatters: "Generel overkrops-styrkereserve — støtter clinch-ramme og modvægt under høje spark.", alternatives: [{ name: "Håndvægts Bænkpres", reason: "Større bevægelsesomfang" }, { name: "Armstrækninger", reason: "Intet udstyr nødvendigt" }] },
    { name: "Bänkpress", notes: "Fötter planterade, lätt båge, stång till mittbröst. Driv hälar och pressa explosivt.", whyItMatters: "Generell överkroppsstyrka-reserv — stöttar clinch-ram och motvikt under höga sparkar.", alternatives: [{ name: "Hantel Bänkpress", reason: "Större rörelseomfång" }, { name: "Armhävning", reason: "Ingen utrustning behövs" }] },
    { name: "Benkpress", notes: "Føtter plantet, lett bue, stang til midt-bryst. Driv hæler og press eksplosivt.", whyItMatters: "Generell overkroppsstyrke-reserve — støtter clinch-ramme og motvekt under høye spark.", alternatives: [{ name: "Manual Benkpress", reason: "Større bevegelsesomfang" }, { name: "Push-Up", reason: "Ingen utstyr nødvendig" }] },
  ),
  singleArmRow: E(
    { id: "single-arm-row", category: "strength", muscleGroups: ["back", "core", "shoulders"], sets: 4, reps: "8 each side", tempo: "2-1-X-1", rest: "60 sec", videoId: "pYcpY20QaE8" },
    { name: "Single-Arm Dumbbell Row", notes: "Hand on bench, flat back. Row dumbbell to hip, elbow tracking back. Resist trunk rotation.", whyItMatters: "Trains anti-rotation core + unilateral pulling — directly supports trunk stability during one-sided kicks.", alternatives: [{ name: "Inverted Row", reason: "Bilateral bodyweight option" }] },
    { name: "Ét-Armet Håndvægts Rodning", notes: "Hånd på bænk, flad ryg. Rodning af håndvægt til hofte, albue tilbage. Modvirk torso-rotation.", whyItMatters: "Træner anti-rotations kerne + unilateral træk — støtter direkte torso-stabilitet under ensidige spark.", alternatives: [{ name: "Inverted Row", reason: "Bilateral kropsvægts-mulighed" }] },
    { name: "Enarmsrodd Med Hantel", notes: "Hand på bänk, platt rygg. Rodd hantel till höft, armbåge bakåt. Motverka bål-rotation.", whyItMatters: "Tränar antirotation-bål + unilateralt drag — stöttar direkt bål-stabilitet under ensidiga sparkar.", alternatives: [{ name: "Inverted Row", reason: "Bilateralt kroppsviktsalternativ" }] },
    { name: "Énarms Manualrodning", notes: "Hånd på benk, flat rygg. Rodning av manual til hofte, albue bakover. Motvirk torso-rotasjon.", whyItMatters: "Trener anti-rotasjons kjerne + unilateralt trekk — støtter direkte torso-stabilitet under ensidige spark.", alternatives: [{ name: "Inverted Row", reason: "Bilateralt kroppsvektsalternativ" }] },
  ),
  reverseLunge: E(
    { id: "reverse-lunge", category: "strength", muscleGroups: ["quads", "glutes", "hamstrings"], sets: 3, reps: "8 each leg", tempo: "2-0-1-0", rest: "60 sec", videoId: "xrPteyQLGAo" },
    { name: "Reverse Lunge", notes: "Step backward into lunge, front shin vertical. Drive through front heel to stand.", whyItMatters: "Knee-friendly unilateral builder — develops base-leg strength that supports kicks without compromising joints.", alternatives: [{ name: "Forward Lunge", reason: "Slightly higher knee load" }, { name: "Bulgarian Split Squat", reason: "Higher unilateral demand" }] },
    { name: "Reverse Udfald", notes: "Træd baglæns til udfald, forreste skinneben lodret. Driv gennem forreste hæl op.", whyItMatters: "Knæ-venlig unilateral bygger — udvikler base-bens styrke som støtter spark uden at belaste led.", alternatives: [{ name: "Frem-Udfald", reason: "Lidt højere knæbelastning" }, { name: "Bulgarian Split Squat", reason: "Højere unilateralt krav" }] },
    { name: "Bakåt-Utfall", notes: "Kliv bakåt till utfall, främre skenben lodrätt. Driv genom främre häl upp.", whyItMatters: "Knävänlig unilateral byggare — utvecklar basbens styrka som stöttar spark utan att belasta leder.", alternatives: [{ name: "Framåt-Utfall", reason: "Något högre knäbelastning" }, { name: "Bulgarian Split Squat", reason: "Högre unilateralt krav" }] },
    { name: "Reverse Utfall", notes: "Tre baklengs til utfall, fremre skinnebein loddrett. Driv gjennom fremre hæl opp.", whyItMatters: "Knevennlig unilateral bygger — utvikler basebens styrke som støtter spark uten å belaste ledd.", alternatives: [{ name: "Frem-Utfall", reason: "Litt høyere knebelastning" }, { name: "Bulgarian Split Squat", reason: "Høyere unilateralt krav" }] },
  ),
  cableWoodchop: ESame(
    { id: "cable-woodchop", category: "strength", muscleGroups: ["core", "shoulders", "back"], sets: 3, reps: "10 each side", rest: "60 sec", videoId: "Vfx_HmHTAdY" },
    { name: "Cable Woodchop", notes: "High-to-low diagonal chop. Pivot back foot, rotate from hips. Arms stay straight.", whyItMatters: "Trains the diagonal force production that translates to rotational kicks and punches.", alternatives: [{ name: "Med Ball Side Slam", reason: "Explosive variant" }] },
  ),
  farmersCarry: E(
    { id: "farmers-carry", category: "strength", muscleGroups: ["core", "back", "shoulders"], sets: 4, reps: "30 m", rest: "60 sec", videoId: "Fkzk_RqlYig" },
    { name: "Farmer's Carry", notes: "Heavy dumbbells/kettlebells each hand. Walk tall, ribs down, shoulders packed. Don't shrug.", whyItMatters: "Builds grip, core, and postural endurance — the silent foundation of every athletic position.", alternatives: [{ name: "Suitcase Carry", reason: "Unilateral variant" }] },
    { name: "Farmer's Carry", notes: "Tunge håndvægte/kettlebells i hver hånd. Gå oprejst, ribben nede, skuldre samlet. Træk ikke skuldre op.", whyItMatters: "Opbygger greb, kerne og postural udholdenhed — den stille fundament i hver atletisk position.", alternatives: [{ name: "Suitcase Carry", reason: "Unilateral variant" }] },
    { name: "Farmer's Walk", notes: "Tunga hantlar/kettlebells i varje hand. Gå rakt, revben ned, axlar samlade. Höj inte axlarna.", whyItMatters: "Bygger grepp, bål och postural uthållighet — den tysta grunden i varje atletisk position.", alternatives: [{ name: "Suitcase Carry", reason: "Unilateral variant" }] },
    { name: "Farmer's Carry", notes: "Tunge manualer/kettlebells i hver hånd. Gå oppreist, ribbein ned, skuldre samlet. Trekk ikke skuldre opp.", whyItMatters: "Bygger grep, kjerne og postural utholdenhet — den stille grunnvollen i hver atletisk posisjon.", alternatives: [{ name: "Suitcase Carry", reason: "Unilateral variant" }] },
  ),
  cossackSquat: E(
    { id: "cossack-squat", category: "strength", muscleGroups: ["quads", "glutes", "hip-flexors"], sets: 3, reps: "6 each side", tempo: "3-1-1-0", rest: "60 sec", videoId: "OOnwfDQHHTk" },
    { name: "Cossack Squat", notes: "Wide stance, squat over one leg, other leg straight with toes up. Switch sides.", whyItMatters: "Builds lateral leg strength and hip mobility — protects knees during wide stances and side kicks.", alternatives: [{ name: "Lateral Lunge", reason: "Dynamic version" }] },
    { name: "Cossack Squat", notes: "Bred stance, squat over ét ben, andet ben strakt med tæer op. Skift side.", whyItMatters: "Opbygger lateral benstyrke og hoftemobilitet — beskytter knæ under brede stancer og sidespark.", alternatives: [{ name: "Lateral Udfald", reason: "Dynamisk version" }] },
    { name: "Cossack Squat", notes: "Bred ställning, knäböj över ett ben, andra benet rakt med tår upp. Växla sida.", whyItMatters: "Bygger lateral benstyrka och höftmobilitet — skyddar knän under breda ställningar och sidsparkar.", alternatives: [{ name: "Lateralt Utfall", reason: "Dynamisk version" }] },
    { name: "Cossack Squat", notes: "Bred stance, knebøy over ett bein, andre bein rett med tær opp. Veksle side.", whyItMatters: "Bygger lateral beinstyrke og hoftemobilitet — beskytter knær under brede stances og sidespark.", alternatives: [{ name: "Lateralt Utfall", reason: "Dynamisk versjon" }] },
  ),

  // ───────────────────────── MOBILITY (7) ─────────────────────────
  ninetyNinety: E(
    { id: "ninety-ninety", category: "mobility", muscleGroups: ["hip-flexors", "glutes", "core"], sets: 3, reps: "8 each side", rest: "30 sec", videoId: "lW8VK9hG33I" },
    { name: "90/90 Hip Switch", notes: "Sit with both knees at 90°. Switch sides slowly through middle. Stay tall.", whyItMatters: "Builds internal + external hip rotation — the freedom needed for high turning kicks.", alternatives: [{ name: "Half-Kneeling Hip Stretch", reason: "Static variant" }] },
    { name: "90/90 Hofteskift", notes: "Sid med begge knæ i 90°. Skift sider langsomt gennem midten. Hold oprejst.", whyItMatters: "Opbygger indvendig + udvendig hofterotation — den frihed der kræves for høje vendingsspark.", alternatives: [{ name: "Halv-Knælende Hoftestrækning", reason: "Statisk variant" }] },
    { name: "90/90 Höftväxling", notes: "Sitt med båda knän i 90°. Växla sidor långsamt genom mitten. Stå rakt.", whyItMatters: "Bygger inåt + utåt höftrotation — friheten som krävs för höga svängsparkar.", alternatives: [{ name: "Halvknästående Höftstretch", reason: "Statisk variant" }] },
    { name: "90/90 Hofteskift", notes: "Sitt med begge knær i 90°. Veksle sider langsomt gjennom midten. Hold oppreist.", whyItMatters: "Bygger innover + utover hofterotasjon — friheten som kreves for høye vendingspark.", alternatives: [{ name: "Halv-Knestående Hoftestretch", reason: "Statisk variant" }] },
  ),
  jeffersonCurl: E(
    { id: "jefferson-curl", category: "mobility", muscleGroups: ["hamstrings", "back", "core"], sets: 3, reps: "8", tempo: "Slow segmental", rest: "45 sec", videoId: "JdkN_-deDt8" },
    { name: "Jefferson Curl", notes: "Light dumbbell. Roll down segment-by-segment from neck. Reverse roll up. Knees locked.", whyItMatters: "Trains end-range spinal + hamstring control — protects the back when bending fast in evasions.", alternatives: [{ name: "Standing Toe Touch", reason: "Static version" }] },
    { name: "Jefferson Curl", notes: "Let håndvægt. Rul ned segment-for-segment fra nakke. Rul op tilbage. Låste knæ.", whyItMatters: "Træner slut-range rygsøjle + hamstring kontrol — beskytter ryg ved hurtig bøjning i undvigelser.", alternatives: [{ name: "Stående Tå-Berøring", reason: "Statisk version" }] },
    { name: "Jefferson Curl", notes: "Lätt hantel. Rulla ner segment-för-segment från nacken. Rulla upp tillbaka. Låsta knän.", whyItMatters: "Tränar slutområdes-rygg + hamstring kontroll — skyddar rygg vid snabb böjning i undanmanövrar.", alternatives: [{ name: "Stående Tå-Beröring", reason: "Statisk version" }] },
    { name: "Jefferson Curl", notes: "Lett manual. Rull ned segment-for-segment fra nakke. Rull opp tilbake. Låste knær.", whyItMatters: "Trener slutt-range rygg + hamstring kontroll — beskytter rygg ved rask bøyning i unngåelser.", alternatives: [{ name: "Stående Tå-Berøring", reason: "Statisk versjon" }] },
  ),
  pancakeStretch: ESame(
    { id: "pancake-stretch", category: "mobility", muscleGroups: ["hamstrings", "hip-flexors", "back"], sets: 3, reps: "30-45 sec", rest: "30 sec", videoId: "" },
    { name: "Active Pancake Stretch", notes: "Seated wide-legs. Reach forward and to each leg actively, holding for 5 seconds at end-range.", whyItMatters: "Opens the adductors and hamstrings for full side-kick and 360° kick range.", alternatives: [{ name: "Wide-Leg Forward Fold", reason: "Passive version" }] },
  ),
  threadTheNeedle: ESame(
    { id: "thread-needle", category: "mobility", muscleGroups: ["back", "shoulders", "core"], sets: 2, reps: "8 each side", rest: "30 sec", videoId: "" },
    { name: "Thread the Needle", notes: "Quadruped start. Slide one arm under and across body until shoulder + ear touch floor. Reverse.", whyItMatters: "Frees up thoracic rotation — directly improves the windup of spinning kicks and rotational punches.", alternatives: [{ name: "Open Book Stretch", reason: "Side-lying alternative" }] },
  ),
  couchStretch: E(
    { id: "couch-stretch", category: "mobility", muscleGroups: ["hip-flexors", "quads"], sets: 2, reps: "60 sec each leg", rest: "30 sec", videoId: "lZ4OuKD-9X4" },
    { name: "Couch Stretch", notes: "Rear shin against wall/couch, front foot flat. Drive hips forward + tuck pelvis. Breathe.", whyItMatters: "Best hip-flexor + quad opener — restores extension lost from constant kicking and sitting.", alternatives: [{ name: "Half-Kneeling Hip Flexor Stretch", reason: "Less aggressive version" }] },
    { name: "Couch Stretch", notes: "Bagerste skinneben mod væg/sofa, forreste fod fladt. Driv hofter frem + tilt bækken. Træk vejret.", whyItMatters: "Bedste hofteflexor + quad-åbner — genopretter ekstension tabt fra konstant sparkning og siddende stilling.", alternatives: [{ name: "Halv-Knælende Hofteflexor-Strækning", reason: "Mindre aggressiv version" }] },
    { name: "Couch Stretch", notes: "Bakre skenben mot vägg/soffa, främre fot platt. Driv höfter framåt + tilta bäcken. Andas.", whyItMatters: "Bästa höftflexor + quad-öppnare — återställer extension förlorad av konstant sparkning och stillasittande.", alternatives: [{ name: "Halvknästående Höftflexor-Stretch", reason: "Mindre aggressiv version" }] },
    { name: "Couch Stretch", notes: "Bakre skinnebein mot vegg/sofa, fremre fot flat. Driv hofter frem + tilt bekken. Pust.", whyItMatters: "Beste hofteflexor + quad-åpner — gjenoppretter ekstensjon tapt fra konstant sparking og stillesitting.", alternatives: [{ name: "Halv-Knestående Hofteflexor-Stretch", reason: "Mindre aggressiv versjon" }] },
  ),
  bandedShoulderDislocate: ESame(
    { id: "shoulder-dislocate", category: "mobility", muscleGroups: ["shoulders", "back"], sets: 3, reps: "10", rest: "30 sec", videoId: "" },
    { name: "Banded Shoulder Pass-Through", notes: "Hold band wide, pass slowly overhead to behind back, return. Narrow grip as mobility improves.", whyItMatters: "Restores shoulder range needed for clean guard position and overhead striking power.", alternatives: [{ name: "Wall Slides", reason: "No band needed" }] },
  ),
  ankleWallRock: ESame(
    { id: "ankle-wall-rock", category: "mobility", muscleGroups: ["calves"], sets: 3, reps: "10 each side", rest: "30 sec", videoId: "" },
    { name: "Knee-to-Wall Ankle Rock", notes: "Toes ~10 cm from wall, drive knee to touch wall keeping heel down. Increase distance over time.", whyItMatters: "Restores dorsiflexion — required for safe landings, deep stances, and pushing off the floor explosively.", alternatives: [{ name: "Calf Stretch on Step", reason: "Static variant" }] },
  ),
};
