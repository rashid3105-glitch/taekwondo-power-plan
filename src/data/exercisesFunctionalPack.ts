// Functional pack — multi-joint, real-world movement patterns (carry, hinge, rotate, brace).
// Same shape as exercisesMobilityPack.ts. EN/DA/SV/NO authored; DE+AR fall back to EN.

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

type Meta = Omit<Base, "en" | "da" | "sv" | "de" | "ar" | "no">;
type T = [name: string, notes: string, why: string, altName?: string, altReason?: string];

const l = ([name, notes, whyItMatters, altName, altReason]: T): L => ({
  name, notes, whyItMatters,
  ...(altName ? { alternatives: [{ name: altName, reason: altReason || "" }] } : {}),
});

const F = (meta: Meta, en: T, da: T, sv: T, no: T): Base => {
  const e = l(en);
  return { ...meta, en: e, da: l(da), sv: l(sv), no: l(no), de: e, ar: e };
};

export const exercisesFunctionalPack: Record<string, Base> = {
  farmersCarry: F(
    { id: "fn-farmers-carry", category: "strength", muscleGroups: ["core", "shoulders", "back"], sets: 3, reps: "30 m", rest: "60 sec", videoId: "" },
    ["Farmer's Carry", "Hold a heavy dumbbell or kettlebell in each hand. Walk tall with short, quick steps, shoulders down and ribs stacked over the pelvis.", "Builds grip, trunk stiffness and postural strength under load — the base for staying solid in clinches and on contact.", "Single Kettlebell Hold", "Static hold if space is limited"],
    ["Farmer's Carry", "Hold en tung håndvægt eller kettlebell i hver hånd. Gå rank med korte, hurtige skridt, skuldrene nede og ribbenene over bækkenet.", "Bygger greb, stammestivhed og holdningsstyrke under belastning — fundamentet for at stå solidt ved kontakt.", "Statisk kettlebell-hold", "Statisk hold hvis pladsen er begrænset"],
    ["Farmer's Carry", "Håll en tung hantel eller kettlebell i varje hand. Gå rak med korta, snabba steg, axlarna nere och revbenen över bäckenet.", "Bygger grepp, bålstabilitet och hållningsstyrka under belastning — grunden för att stå stadigt vid kontakt.", "Statiskt kettlebellhåll", "Statiskt håll om ytan är begränsad"],
    ["Farmer's Carry", "Hold en tung manual eller kettlebell i hver hånd. Gå rank med korte, raske skritt, skuldrene nede og ribbeina over bekkenet.", "Bygger grep, stammestivhet og holdningsstyrke under belastning — grunnlaget for å stå stødig ved kontakt.", "Statisk kettlebell-hold", "Statisk hold hvis plassen er begrenset"],
  ),
  suitcaseCarry: F(
    { id: "fn-suitcase-carry", category: "strength", muscleGroups: ["core", "glutes", "shoulders"], sets: 3, reps: "20 m each side", rest: "45 sec", videoId: "" },
    ["Suitcase Carry", "Carry one heavy weight in one hand. Walk without leaning toward or away from the load; keep the hips level.", "Trains the lateral core and hip stabilisers that keep you upright on one leg while kicking.", "Farmer's Carry", "Easier version with load on both sides"],
    ["Kuffertbæring", "Bær én tung vægt i den ene hånd. Gå uden at læne dig mod eller væk fra vægten; hold hofterne vandrette.", "Træner den laterale core og hoftestabilisatorerne, der holder dig oprejst på ét ben, når du sparker.", "Farmer's Carry", "Lettere version med vægt på begge sider"],
    ["Resväskebärning", "Bär en tung vikt i ena handen. Gå utan att luta dig mot eller från vikten; håll höfterna i våg.", "Tränar den laterala bålen och höftstabilisatorerna som håller dig upprätt på ett ben när du sparkar.", "Farmer's Carry", "Lättare variant med vikt på båda sidor"],
    ["Koffertbæring", "Bær én tung vekt i den ene hånden. Gå uten å lene deg mot eller bort fra vekten; hold hoftene vannrette.", "Trener den laterale kjernen og hoftestabilisatorene som holder deg oppreist på ett bein når du sparker.", "Farmer's Carry", "Lettere variant med vekt på begge sider"],
  ),
  turkishGetUp: F(
    { id: "fn-turkish-get-up", category: "strength", muscleGroups: ["shoulders", "core", "glutes"], sets: 3, reps: "2 each side", tempo: "Slow, step by step", rest: "60 sec", videoId: "" },
    ["Turkish Get-Up", "Lie on your back with a kettlebell pressed up. Roll to elbow, hand, bridge, sweep the leg through to a half-kneel, then stand. Reverse every step. Eyes on the bell.", "Links shoulder stability, core control and hip mobility in one pattern — excellent for getting up from the floor safely under control.", "Half Get-Up", "Stop at the hand position while learning"],
    ["Turkish Get-Up", "Lig på ryggen med en kettlebell presset op. Rul til albue, hånd, bro, før benet igennem til halvknælende, og rejs dig. Vend hvert trin om. Blikket på kettlebellen.", "Forbinder skulderstabilitet, corekontrol og hoftemobilitet i ét mønster — fremragende til at komme op fra gulvet kontrolleret.", "Halv Get-Up", "Stop ved håndpositionen mens du lærer den"],
    ["Turkish Get-Up", "Ligg på rygg med en kettlebell upppressad. Rulla till armbåge, hand, brygga, för benet igenom till halvknäståend och res dig. Vänd varje steg. Blicken på kettlebellen.", "Kopplar ihop axelstabilitet, bålkontroll och höftrörlighet i ett mönster — utmärkt för att resa sig kontrollerat från golvet.", "Halv Get-Up", "Stanna vid handpositionen medan du lär dig"],
    ["Turkish Get-Up", "Ligg på ryggen med en kettlebell presset opp. Rull til albue, hånd, bro, før beinet gjennom til halvknestående, og reis deg. Snu hvert trinn. Blikket på kettlebellen.", "Kobler skulderstabilitet, kjernekontroll og hoftemobilitet i ett mønster — utmerket for å reise seg kontrollert fra gulvet.", "Halv Get-Up", "Stopp ved håndposisjonen mens du lærer"],
  ),
  kbSwing: F(
    { id: "fn-kettlebell-swing", category: "power", muscleGroups: ["glutes", "hamstrings", "core"], sets: 4, reps: "15", tempo: "Explosive hip snap", rest: "60 sec", videoId: "" },
    ["Kettlebell Swing", "Hinge at the hips, hike the bell back between the legs, then snap the hips forward so the bell floats to chest height. Arms are ropes — the hips do the work.", "Develops explosive hip extension, the same drive that powers fast kicks and quick push-offs.", "Dumbbell Swing", "Use a dumbbell if no kettlebell is available"],
    ["Kettlebell Swing", "Hoftebøj, før kettlebellen tilbage mellem benene, og skyd hofterne frem, så den svæver op i brysthøjde. Armene er reb — hofterne gør arbejdet.", "Udvikler eksplosiv hofteekstension, samme drivkraft som giver hurtige spark og hurtige fraskub.", "Håndvægtsswing", "Brug en håndvægt hvis der ikke er en kettlebell"],
    ["Kettlebell Swing", "Fäll i höften, för kettlebellen bakåt mellan benen och skjut fram höfterna så den svävar upp till brösthöjd. Armarna är rep — höfterna gör jobbet.", "Utvecklar explosiv höftextension, samma kraft som ger snabba sparkar och snabba frånskjut.", "Hantelswing", "Använd en hantel om kettlebell saknas"],
    ["Kettlebell Swing", "Hoftebøy, før kettlebellen bakover mellom beina, og skyt hoftene fram så den svever opp til brysthøyde. Armene er tau — hoftene gjør jobben.", "Utvikler eksplosiv hofteekstensjon, samme drivkraft som gir raske spark og raske fraskyv.", "Manualswing", "Bruk manual hvis kettlebell mangler"],
  ),
  goblet: F(
    { id: "fn-goblet-squat", category: "strength", muscleGroups: ["quads", "glutes", "core"], sets: 3, reps: "10", tempo: "3 sec down", rest: "60 sec", videoId: "" },
    ["Goblet Squat", "Hold a kettlebell at the chest. Sit down between your heels with chest up and knees pushed out, then drive up through the whole foot.", "Grooves a deep, upright squat with core bracing — the foundation for strong, stable stances.", "Box Squat", "Squat to a box to control depth"],
    ["Goblet Squat", "Hold en kettlebell foran brystet. Sæt dig ned mellem hælene med brystet oppe og knæene presset ud, og pres op gennem hele foden.", "Indøver en dyb, oprejst squat med corestabilitet — fundamentet for stærke, stabile stande.", "Box Squat", "Squat ned til en kasse for at styre dybden"],
    ["Goblet Squat", "Håll en kettlebell framför bröstet. Sätt dig ner mellan hälarna med bröstet uppe och knäna utåt, pressa upp genom hela foten.", "Nöter in en djup, upprätt knäböj med bålstabilitet — grunden för starka, stabila ställningar.", "Box Squat", "Knäböj ner till en låda för att styra djupet"],
    ["Goblet Squat", "Hold en kettlebell foran brystet. Sett deg ned mellom hælene med brystet oppe og knærne presset ut, og press opp gjennom hele foten.", "Innøver en dyp, oppreist knebøy med kjernestabilitet — grunnlaget for sterke, stabile stillinger.", "Box Squat", "Knebøy ned til en kasse for å styre dybden"],
  ),
  reverseLungeReach: F(
    { id: "fn-reverse-lunge-reach", category: "mobility", muscleGroups: ["quads", "glutes", "hip-flexors", "core"], sets: 3, reps: "8 each side", rest: "45 sec", videoId: "" },
    ["Reverse Lunge with Overhead Reach", "Step back into a lunge and reach both arms overhead, slightly toward the front-leg side. Drive back to standing through the front heel.", "Combines single-leg strength with a hip-flexor and trunk stretch — opens the front of the hip used for high kicks.", "Static Split Squat", "Remove the step for more stability"],
    ["Baglæns udfald med armstræk", "Træd tilbage i et udfald og stræk begge arme over hovedet, let mod forbenets side. Pres tilbage til stående gennem forreste hæl.", "Kombinerer etbensstyrke med stræk af hoftebøjer og trup — åbner forsiden af hoften til høje spark.", "Statisk split squat", "Fjern skridtet for mere stabilitet"],
    ["Bakåtutfall med armsträck", "Kliv bakåt till ett utfall och sträck båda armarna över huvudet, lätt mot frambenets sida. Pressa tillbaka genom främre hälen.", "Kombinerar enbensstyrka med sträckning av höftböjare och bål — öppnar höftens framsida för höga sparkar.", "Statisk split squat", "Ta bort steget för mer stabilitet"],
    ["Baklengs utfall med armstrekk", "Gå bakover i et utfall og strekk begge armer over hodet, litt mot frambeinets side. Press tilbake gjennom fremre hæl.", "Kombinerer ettbeinsstyrke med strekk av hoftebøyer og overkropp — åpner hoftens forside for høye spark.", "Statisk split squat", "Fjern skrittet for mer stabilitet"],
  ),
  lateralLunge: F(
    { id: "fn-lateral-lunge", category: "mobility", muscleGroups: ["glutes", "quads", "hip-flexors"], sets: 3, reps: "8 each side", rest: "45 sec", videoId: "" },
    ["Lateral Lunge", "Step wide to the side, sit back into that hip with the other leg straight and both feet flat. Push back to the middle.", "Builds strength and mobility in the frontal plane — key for lateral footwork and side-stepping.", "Cossack Squat", "Harder version with deeper range"],
    ["Sideudfald", "Træd bredt ud til siden, sæt dig tilbage i den hofte med det andet ben strakt og begge fødder i gulvet. Pres tilbage til midten.", "Bygger styrke og mobilitet sidelæns — centralt for sidelæns fodarbejde og sidetrin.", "Cossack Squat", "Sværere version med dybere bevægelse"],
    ["Sidoutfall", "Kliv brett åt sidan, sätt dig bak i den höften med andra benet rakt och båda fötterna i golvet. Pressa tillbaka till mitten.", "Bygger styrka och rörlighet i sidled — centralt för sidledes fotarbete och sidsteg.", "Cossack Squat", "Svårare variant med djupare rörelse"],
    ["Sideutfall", "Gå bredt ut til siden, sett deg tilbake i den hofta med det andre beinet strakt og begge føttene i gulvet. Press tilbake til midten.", "Bygger styrke og mobilitet sidelengs — sentralt for sidelengs fotarbeid og sidesteg.", "Cossack Squat", "Vanskeligere variant med dypere bevegelse"],
  ),
  singleLegRdlReach: F(
    { id: "fn-single-leg-rdl-reach", category: "strength", muscleGroups: ["hamstrings", "glutes", "core"], sets: 3, reps: "8 each side", tempo: "3 sec down", rest: "45 sec", videoId: "" },
    ["Single-Leg RDL Reach", "Stand on one leg, hinge forward reaching both hands toward the floor while the free leg rises behind you. Keep hips square, then return tall.", "Strengthens the posterior chain and ankle stability on one leg — exactly the support leg demand when kicking.", "Kickstand RDL", "Back toe lightly on the floor for balance"],
    ["Etbens-RDL med rækning", "Stå på ét ben, hoftebøj frem og ræk begge hænder mod gulvet, mens det frie ben løftes bag dig. Hold hofterne lige, og vend tilbage til rank.", "Styrker bagsiden og ankelstabiliteten på ét ben — præcis kravet til standbenet, når du sparker.", "Kickstand-RDL", "Bagerste tå let i gulvet for balance"],
    ["Enbens-RDL med räckning", "Stå på ett ben, fäll framåt och räck händerna mot golvet medan det fria benet lyfts bakåt. Håll höfterna raka och res dig.", "Stärker baksidan och fotledsstabiliteten på ett ben — precis kravet på stödbenet när du sparkar.", "Kickstand-RDL", "Bakre tån lätt i golvet för balans"],
    ["Ettbeins-RDL med rekking", "Stå på ett bein, hoftebøy fram og rekk hendene mot gulvet mens det frie beinet løftes bak deg. Hold hoftene rette og reis deg.", "Styrker baksiden og ankelstabiliteten på ett bein — nøyaktig kravet til standbeinet når du sparker.", "Kickstand-RDL", "Bakre tå lett i gulvet for balanse"],
  ),
  stepUpKnee: F(
    { id: "fn-step-up-knee-drive", category: "power", muscleGroups: ["quads", "glutes", "hip-flexors"], sets: 3, reps: "8 each side", tempo: "Fast up, slow down", rest: "45 sec", videoId: "" },
    ["Step-Up with Knee Drive", "Step onto a box and drive the opposite knee up to hip height as you stand tall. Lower slowly with control.", "Trains single-leg drive and the knee-chamber position used at the start of most kicks.", "Bodyweight Step-Up", "Drop the knee drive while learning"],
    ["Step-Up med knæløft", "Træd op på en kasse og før det modsatte knæ op i hoftehøjde, mens du rejser dig. Sænk langsomt og kontrolleret.", "Træner etbens-drive og knæoptrækket, som indleder de fleste spark.", "Step-Up med kropsvægt", "Udelad knæløftet mens du lærer"],
    ["Step-Up med knälyft", "Kliv upp på en låda och driv upp motsatt knä till höfthöjd när du reser dig. Sänk långsamt och kontrollerat.", "Tränar enbensdriv och knäupptaget som inleder de flesta sparkar.", "Step-Up med kroppsvikt", "Hoppa över knälyftet medan du lär dig"],
    ["Step-Up med kneløft", "Gå opp på en kasse og driv motsatt kne opp til hoftehøyde når du reiser deg. Senk sakte og kontrollert.", "Trener ettbeinsdriv og kneoppdraget som innleder de fleste spark.", "Step-Up med kroppsvekt", "Dropp kneløftet mens du lærer"],
  ),
  bearCrawl: F(
    { id: "fn-bear-crawl", category: "mobility", muscleGroups: ["core", "shoulders", "quads"], sets: 3, reps: "15 m", rest: "45 sec", videoId: "" },
    ["Bear Crawl", "On hands and feet with knees hovering 5 cm off the floor, crawl forward moving opposite hand and foot together. Keep the back flat.", "Builds cross-body coordination, shoulder stability and core control in a whole-body pattern.", "Bear Hold", "Static hold to build the position first"],
    ["Bjørnekravl", "På hænder og fødder med knæene svævende 5 cm over gulvet, kravl frem med modsat hånd og fod samtidig. Hold ryggen flad.", "Bygger krydskoordination, skulderstabilitet og corekontrol i et helkropsmønster.", "Bjørnehold", "Statisk hold for at lære positionen først"],
    ["Björnkrypning", "På händer och fötter med knäna svävande 5 cm över golvet, kryp framåt med motsatt hand och fot samtidigt. Håll ryggen platt.", "Bygger korskoordination, axelstabilitet och bålkontroll i ett helkroppsmönster.", "Björnhåll", "Statiskt håll för att lära positionen först"],
    ["Bjørnekrabbing", "På hender og føtter med knærne svevende 5 cm over gulvet, krabb fram med motsatt hånd og fot samtidig. Hold ryggen flat.", "Bygger krysskoordinasjon, skulderstabilitet og kjernekontroll i et helkroppsmønster.", "Bjørnehold", "Statisk hold for å lære posisjonen først"],
  ),
  crabReach: F(
    { id: "fn-crab-reach", category: "mobility", muscleGroups: ["glutes", "shoulders", "chest"], sets: 2, reps: "6 each side", tempo: "2 sec hold at top", rest: "30 sec", videoId: "" },
    ["Crab Reach", "Sit with hands behind you and feet flat. Drive the hips up and reach one arm overhead and across, rotating through the upper back. Return and switch.", "Opens the chest and front of the hips while activating the glutes — a great counter to a hunched guard posture.", "Glute Bridge", "Skip the reach if the shoulder is limited"],
    ["Krabbe-rækning", "Sid med hænderne bag dig og fødderne i gulvet. Løft hofterne og ræk den ene arm over hovedet og på tværs med rotation i øvre ryg. Vend tilbage og skift.", "Åbner brystet og hoftens forside og aktiverer ballerne — en god modvægt til en sammenkrøbet garde.", "Glute Bridge", "Udelad rækningen hvis skulderen er begrænset"],
    ["Krabbräckning", "Sitt med händerna bakom dig och fötterna i golvet. Lyft höfterna och räck ena armen över huvudet och på tvären med rotation i övre ryggen. Byt sida.", "Öppnar bröstet och höftens framsida och aktiverar sätet — en bra motvikt till en hopsjunken gard.", "Glute Bridge", "Hoppa över räckningen om axeln är begränsad"],
    ["Krabberekking", "Sitt med hendene bak deg og føttene i gulvet. Løft hoftene og rekk den ene armen over hodet og på tvers med rotasjon i øvre rygg. Bytt side.", "Åpner brystet og hoftens forside og aktiverer setet — en god motvekt til en sammensunket garde.", "Glute Bridge", "Dropp rekkingen hvis skulderen er begrenset"],
  ),
  pallofPress: F(
    { id: "fn-pallof-press", category: "strength", muscleGroups: ["core", "shoulders"], sets: 3, reps: "10 each side", tempo: "2 sec hold", rest: "30 sec", videoId: "" },
    ["Pallof Press", "Stand side-on to a cable or band anchored at chest height. Press the handle straight out and resist the pull to rotate. Hold, then return.", "Teaches the trunk to resist rotation — protecting the spine and keeping your base stable when absorbing hits.", "Half-Kneeling Pallof", "More stable position for beginners"],
    ["Pallof Press", "Stå med siden til et kabel eller elastik fastgjort i brysthøjde. Pres håndtaget lige frem og modstå trækket mod rotation. Hold og vend tilbage.", "Lærer truppen at modstå rotation — beskytter ryggen og holder basen stabil, når du tager imod slag.", "Halvknælende Pallof", "Mere stabil position for begyndere"],
    ["Pallof Press", "Stå med sidan mot en kabel eller ett band fäst i brösthöjd. Pressa handtaget rakt fram och motstå draget att rotera. Håll och återgå.", "Lär bålen att motstå rotation — skyddar ryggen och håller basen stabil när du tar emot träffar.", "Halvknästående Pallof", "Stabilare position för nybörjare"],
    ["Pallof Press", "Stå med siden mot en kabel eller strikk festet i brysthøyde. Press håndtaket rett fram og motstå draget mot rotasjon. Hold og gå tilbake.", "Lærer overkroppen å motstå rotasjon — beskytter ryggen og holder basen stabil når du tar imot treff.", "Halvknestående Pallof", "Mer stabil posisjon for nybegynnere"],
  ),
  woodchop: F(
    { id: "fn-cable-woodchop", category: "power", muscleGroups: ["core", "shoulders", "glutes"], sets: 3, reps: "10 each side", tempo: "Fast rotation, slow return", rest: "45 sec", videoId: "" },
    ["Cable Woodchop", "Pull a cable or band diagonally from high to low across the body, pivoting the back foot and turning the hips. Control the return.", "Trains rotational power transfer from feet through hips to hands — the same chain behind turning kicks and punches.", "Med Ball Chop", "Use a light medicine ball without a cable"],
    ["Kabel-woodchop", "Træk et kabel eller elastik diagonalt fra højt til lavt på tværs af kroppen, mens bagerste fod drejer og hofterne roterer. Styr tilbagevejen.", "Træner rotationskraft fra fødder gennem hofter til hænder — samme kæde som bag rundspark og slag.", "Medicinbold-chop", "Brug en let medicinbold uden kabel"],
    ["Kabel-woodchop", "Dra en kabel eller ett band diagonalt från högt till lågt över kroppen medan bakre foten vrids och höfterna roterar. Kontrollera tillbakavägen.", "Tränar rotationskraft från fötter genom höfter till händer — samma kedja som bakom rundsparkar och slag.", "Medicinbollschop", "Använd en lätt medicinboll utan kabel"],
    ["Kabel-woodchop", "Trekk en kabel eller strikk diagonalt fra høyt til lavt på tvers av kroppen mens bakre fot dreier og hoftene roterer. Kontroller tilbakeveien.", "Trener rotasjonskraft fra føtter gjennom hofter til hender — samme kjede som bak rundspark og slag.", "Medisinball-chop", "Bruk en lett medisinball uten kabel"],
  ),
  medBallRotThrow: F(
    { id: "fn-med-ball-rotational-throw", category: "power", muscleGroups: ["core", "glutes", "shoulders"], sets: 4, reps: "6 each side", tempo: "Max intent", rest: "60 sec", videoId: "" },
    ["Medicine Ball Rotational Throw", "Stand side-on to a wall holding a 3–5 kg ball at the hip. Load the back hip, then rotate explosively and throw the ball into the wall. Catch and reset.", "Develops explosive rotational power — directly transferable to turning kicks and hooks.", "Rotational Band Punch", "No ball or wall available"],
    ["Medicinbold rotationskast", "Stå med siden til en væg med en 3–5 kg bold ved hoften. Lad bagerste hofte, roter eksplosivt og kast bolden ind i væggen. Grib og nulstil.", "Udvikler eksplosiv rotationskraft — overføres direkte til rundspark og hooks.", "Rotationsslag med elastik", "Hvis der ikke er bold eller væg"],
    ["Medicinboll rotationskast", "Stå med sidan mot en vägg med en 3–5 kg boll vid höften. Ladda bakre höften, rotera explosivt och kasta bollen i väggen. Fånga och börja om.", "Utvecklar explosiv rotationskraft — överförs direkt till rundsparkar och krokar.", "Rotationsslag med band", "Om boll eller vägg saknas"],
    ["Medisinball rotasjonskast", "Stå med siden mot en vegg med en 3–5 kg ball ved hofta. Lad bakre hofte, roter eksplosivt og kast ballen i veggen. Ta imot og nullstill.", "Utvikler eksplosiv rotasjonskraft — overføres direkte til rundspark og hooks.", "Rotasjonsslag med strikk", "Hvis ball eller vegg mangler"],
  ),
  medBallSlam: F(
    { id: "fn-med-ball-slam", category: "power", muscleGroups: ["core", "shoulders", "back"], sets: 4, reps: "8", tempo: "Max intent", rest: "45 sec", videoId: "" },
    ["Medicine Ball Slam", "Lift a slam ball overhead rising onto the toes, then slam it into the floor as hard as possible by flexing hips and trunk. Pick up and repeat.", "Trains full-body power and aggressive trunk flexion while building work capacity.", "Band Slam", "Use a band anchored high if no ball"],
    ["Medicinbold-slam", "Løft en slamball over hovedet og kom op på tæerne, og slå den så hårdt som muligt i gulvet ved at bøje hofter og trup. Saml op og gentag.", "Træner helkropskraft og aggressiv fremadbøjning af truppen og bygger samtidig arbejdskapacitet.", "Elastik-slam", "Brug en højt fastgjort elastik hvis der ikke er bold"],
    ["Medicinbollslam", "Lyft en slamboll över huvudet och gå upp på tå, slå sedan ner den så hårt som möjligt i golvet genom att böja höfter och bål. Plocka upp och upprepa.", "Tränar helkroppskraft och aggressiv bålflexion och bygger samtidigt arbetskapacitet.", "Bandslam", "Använd ett högt fäst band om boll saknas"],
    ["Medisinball-slam", "Løft en slamball over hodet og gå opp på tærne, og slå den så hardt som mulig i gulvet ved å bøye hofter og overkropp. Plukk opp og gjenta.", "Trener helkroppskraft og aggressiv fremoverbøying av overkroppen og bygger arbeidskapasitet.", "Strikk-slam", "Bruk en høyt festet strikk hvis ball mangler"],
  ),
  sledPush: F(
    { id: "fn-sled-push", category: "power", muscleGroups: ["quads", "glutes", "calves"], sets: 5, reps: "15 m", rest: "75 sec", videoId: "" },
    ["Sled Push", "Lean into the sled with arms extended and body at a 45° angle. Drive with powerful, short steps on the balls of the feet.", "Builds horizontal force and leg drive without eccentric stress — great for acceleration and pressure-forward fighting.", "Wall Drive March", "Drive against a wall if no sled"],
    ["Slædeskub", "Læn dig ind i slæden med strakte arme og kroppen i 45° vinkel. Driv frem med kraftige, korte skridt på fodballerne.", "Bygger vandret kraft og bendrive uden excentrisk belastning — godt til acceleration og fremadpressende kamp.", "Vægdrive-march", "Skub mod en væg hvis der ikke er slæde"],
    ["Slädpush", "Luta dig mot släden med raka armar och kroppen i 45° vinkel. Driv framåt med kraftfulla, korta steg på trampdynorna.", "Bygger horisontell kraft och bendriv utan excentrisk belastning — bra för acceleration och framåtpressande kamp.", "Väggdriv-marsch", "Tryck mot en vägg om släde saknas"],
    ["Sledeskyv", "Len deg inn i sleden med strake armer og kroppen i 45° vinkel. Driv fram med kraftige, korte skritt på fotballene.", "Bygger horisontal kraft og beindriv uten eksentrisk belastning — bra for akselerasjon og fremoverpressende kamp.", "Veggdriv-marsj", "Skyv mot en vegg hvis slede mangler"],
  ),
  renegadeRow: F(
    { id: "fn-renegade-row", category: "strength", muscleGroups: ["back", "core", "shoulders"], sets: 3, reps: "8 each side", rest: "60 sec", videoId: "" },
    ["Renegade Row", "In a high plank on two dumbbells, feet wide, row one dumbbell to the hip without rotating the hips. Alternate sides.", "Combines pulling strength with anti-rotation core control — supports a strong, stable guard and clinch.", "Single-Arm Bench Row", "Supported version if the plank breaks down"],
    ["Renegade Row", "I høj planke på to håndvægte med brede fødder, ro den ene håndvægt op til hoften uden at hofterne roterer. Skift side.", "Kombinerer trækstyrke med antirotation i core — understøtter en stærk, stabil garde.", "Etarms roning på bænk", "Støttet version hvis planken bryder sammen"],
    ["Renegade Row", "I hög planka på två hantlar med breda fötter, ro ena hanteln upp till höften utan att höfterna roterar. Växla sida.", "Kombinerar dragstyrka med antirotation i bålen — stödjer en stark, stabil gard.", "Enarmsrodd på bänk", "Stödd variant om plankan bryts"],
    ["Renegade Row", "I høy planke på to manualer med brede føtter, ro den ene manualen opp til hofta uten at hoftene roterer. Bytt side.", "Kombinerer trekkstyrke med antirotasjon i kjernen — støtter en sterk, stabil garde.", "Enarms roing på benk", "Støttet variant hvis planken bryter sammen"],
  ),
  deadBugPress: F(
    { id: "fn-dead-bug-press", category: "strength", muscleGroups: ["core", "hip-flexors"], sets: 3, reps: "8 each side", tempo: "Slow, exhale fully", rest: "30 sec", videoId: "" },
    ["Dead Bug with Band Press", "Lie on your back holding a band anchored behind you, arms up. Keep the low back pressed down and slowly extend opposite arm and leg. Return and switch.", "Teaches core bracing while the limbs move independently — the core skill behind controlled kicking and punching.", "Basic Dead Bug", "Remove the band to start"],
    ["Dead Bug med elastik", "Lig på ryggen og hold en elastik fastgjort bag dig med armene oppe. Hold lænden presset ned og stræk langsomt modsat arm og ben. Vend tilbage og skift.", "Lærer corestabilitet, mens arme og ben bevæger sig uafhængigt — kernen bag kontrollerede spark og slag.", "Basis Dead Bug", "Start uden elastik"],
    ["Dead Bug med band", "Ligg på rygg och håll ett band fäst bakom dig med armarna uppe. Håll ländryggen nedtryckt och sträck långsamt motsatt arm och ben. Byt sida.", "Lär bålstabilitet medan armar och ben rör sig oberoende — kärnan bakom kontrollerade sparkar och slag.", "Grundläggande Dead Bug", "Börja utan band"],
    ["Dead Bug med strikk", "Ligg på ryggen og hold en strikk festet bak deg med armene oppe. Hold korsryggen presset ned og strekk sakte motsatt arm og bein. Bytt side.", "Lærer kjernestabilitet mens armer og bein beveger seg uavhengig — kjernen bak kontrollerte spark og slag.", "Grunnleggende Dead Bug", "Start uten strikk"],
  ),
  lateralBound: F(
    { id: "fn-lateral-bound-stick", category: "plyometric", muscleGroups: ["glutes", "quads", "calves"], sets: 3, reps: "5 each side", tempo: "Stick landing 2 sec", rest: "60 sec", videoId: "" },
    ["Lateral Bound and Stick", "Push off one leg and jump sideways onto the other. Land softly on one foot, knee over toes, and hold 2 seconds before bounding back.", "Builds lateral power and single-leg landing control — protects knees and ankles during quick direction changes.", "Lateral Hop", "Smaller jumps with two-foot landing"],
    ["Sidespring med stop", "Sæt af på ét ben og spring sidelæns over på det andet. Land blødt på én fod med knæet over tæerne, og hold 2 sek., før du springer tilbage.", "Bygger sidelæns eksplosivitet og landingskontrol på ét ben — beskytter knæ og ankler ved hurtige retningsskift.", "Sidehop", "Mindre spring med landing på to ben"],
    ["Sidohopp med stopp", "Skjut ifrån med ett ben och hoppa i sidled till det andra. Landa mjukt på en fot med knät över tårna och håll 2 sek innan du hoppar tillbaka.", "Bygger explosivitet i sidled och landningskontroll på ett ben — skyddar knän och fotleder vid snabba riktningsbyten.", "Sidohopp på två ben", "Mindre hopp med landning på två ben"],
    ["Sidehopp med stopp", "Sett av på ett bein og hopp sidelengs over på det andre. Land mykt på én fot med kneet over tærne, og hold 2 sek før du hopper tilbake.", "Bygger sidelengs eksplosivitet og landingskontroll på ett bein — beskytter knær og ankler ved raske retningsskift.", "Sidehopp på to bein", "Mindre hopp med landing på to bein"],
  ),
  sprawlToStand: F(
    { id: "fn-sprawl-to-stand", category: "speed", muscleGroups: ["core", "hip-flexors", "chest", "quads"], sets: 4, reps: "8", tempo: "As fast as possible", rest: "45 sec", videoId: "" },
    ["Sprawl to Stand", "From fighting stance, drop the hands to the floor and shoot the legs back so the hips touch down. Snap the feet back under you and return to stance immediately.", "Trains fast level changes and getting back to your feet quickly — improves reaction and work capacity.", "Squat Thrust", "Without the hips touching the floor"],
    ["Sprawl til stående", "Fra kampstand, sæt hænderne i gulvet og skyd benene bagud, så hofterne rører ned. Træk fødderne ind under dig og kom straks tilbage i stand.", "Træner hurtige niveauskift og at komme hurtigt op igen — forbedrer reaktion og arbejdskapacitet.", "Squat Thrust", "Uden at hofterne rører gulvet"],
    ["Sprawl till stående", "Från kampställning, sätt händerna i golvet och skjut benen bakåt så höfterna når ner. Dra in fötterna under dig och kom direkt tillbaka i ställning.", "Tränar snabba nivåbyten och att snabbt komma upp igen — förbättrar reaktion och arbetskapacitet.", "Squat Thrust", "Utan att höfterna når golvet"],
    ["Sprawl til stående", "Fra kampstilling, sett hendene i gulvet og skyt beina bakover så hoftene når ned. Trekk føttene inn under deg og kom straks tilbake i stilling.", "Trener raske nivåskift og å komme raskt opp igjen — forbedrer reaksjon og arbeidskapasitet.", "Squat Thrust", "Uten at hoftene når gulvet"],
  ),
};
