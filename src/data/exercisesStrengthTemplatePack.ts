// Strength-template pack — exercises used by the 6-day High/Low strength template
// that were missing from the library. Same shape as exercisesGymPack.ts.
// EN/DA/SV/NO authored; DE+AR fall back to EN.

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

export const exercisesStrengthTemplatePack: Record<string, Base> = {
  /* ---------------- PLYOMETRIC & SPEED ---------------- */

  lowSkips: E(
    { id: "low-skips", category: "plyometric", muscleGroups: ["calves", "hip-flexors"], sets: 2, reps: "10 m", rest: "60 sec", videoId: "" },
    { name: "Low Skips", notes: "Skip forward with small, quick contacts on the balls of the feet. Keep the knee lift low and the rhythm fast.", whyItMatters: "Warms up the ankles and teaches quick, stiff ground contacts — the base for light, bouncy footwork.", alternatives: [{ name: "A-Skip", reason: "Slightly more knee drive" }] },
    { name: "Lave skip", notes: "Skip fremad med små, hurtige fodisætninger på forfoden. Hold knæløftet lavt og rytmen høj.", whyItMatters: "Varmer anklerne op og lærer hurtige, stive fodisætninger — grundlaget for let og fjedrende fodarbejde.", alternatives: [{ name: "A-skip", reason: "Lidt mere knæløft" }] },
    { name: "Låga skip", notes: "Skippa framåt med små, snabba isättningar på framfoten. Håll knälyftet lågt och rytmen hög.", whyItMatters: "Värmer upp fotlederna och lär ut snabba, styva markkontakter — grunden för lätt och fjädrande fotarbete.", alternatives: [{ name: "A-skip", reason: "Lite mer knälyft" }] },
    { name: "Lave skip", notes: "Skip fremover med små, raske fotisettinger på forfoten. Hold kneløftet lavt og rytmen høy.", whyItMatters: "Varmer opp anklene og lærer raske, stive bakkekontakter — grunnlaget for lett og fjærende fotarbeid.", alternatives: [{ name: "A-skip", reason: "Litt mer kneløft" }] },
  ),

  powerSkip: E(
    { id: "power-skip", category: "plyometric", muscleGroups: ["glutes", "calves", "hip-flexors"], sets: 2, reps: "10 m", rest: "60-90 sec", videoId: "" },
    { name: "Power Skip", notes: "Skip for maximum height: drive the knee up hard, swing the opposite arm and push powerfully off the ground.", whyItMatters: "Builds vertical power through one leg at a time, like the push-off in a jumping kick.", alternatives: [{ name: "Low Skips", reason: "Lower intensity" }] },
    { name: "Power skip", notes: "Skip så højt som muligt: driv knæet kraftigt op, sving modsatte arm og sæt hårdt af fra gulvet.", whyItMatters: "Bygger lodret eksplosivitet på ét ben ad gangen, som afsættet i et hoppespark.", alternatives: [{ name: "Lave skip", reason: "Lavere intensitet" }] },
    { name: "Power skip", notes: "Skippa så högt som möjligt: driv knät kraftfullt uppåt, sving motsatt arm och tryck ifrån hårt.", whyItMatters: "Bygger vertikal explosivitet på ett ben i taget, som frånskjutet i en hoppspark.", alternatives: [{ name: "Låga skip", reason: "Lägre intensitet" }] },
    { name: "Power skip", notes: "Skip så høyt som mulig: driv kneet kraftig opp, sving motsatt arm og sats hardt fra bakken.", whyItMatters: "Bygger vertikal eksplosivitet på ett bein om gangen, som satsen i et hoppespark.", alternatives: [{ name: "Lave skip", reason: "Lavere intensitet" }] },
  ),

  progressiveBuildUps: E(
    { id: "progressive-build-ups", category: "speed", muscleGroups: ["glutes", "hamstrings", "calves"], sets: 3, reps: "20 m @70/80/90%", rest: "90 sec", videoId: "" },
    { name: "Progressive Build Ups (Sprint)", notes: "Three runs of 20 m at 70%, 80% and 90% effort. Accelerate smoothly and stay relaxed in the shoulders.", whyItMatters: "Prepares the hamstrings for fast sprinting and reduces the risk of strains before maximal work.", alternatives: [{ name: "Strides", reason: "Longer, relaxed runs" }] },
    { name: "Progressive opløb (sprint)", notes: "Tre løb på 20 m ved 70%, 80% og 90% indsats. Accelerer jævnt og hold skuldrene afslappede.", whyItMatters: "Forbereder baglårene på hurtig sprint og mindsker risikoen for forstrækninger før maksimalt arbejde.", alternatives: [{ name: "Stigningsløb", reason: "Længere, afslappede løb" }] },
    { name: "Progressiva upplopp (sprint)", notes: "Tre lopp på 20 m vid 70%, 80% och 90% insats. Accelerera jämnt och håll axlarna avslappnade.", whyItMatters: "Förbereder baksida lår för snabb sprint och minskar risken för sträckningar före maximalt arbete.", alternatives: [{ name: "Stegringslopp", reason: "Längre, avslappnade lopp" }] },
    { name: "Progressive oppløp (sprint)", notes: "Tre løp på 20 m ved 70%, 80% og 90% innsats. Akselerer jevnt og hold skuldrene avslappet.", whyItMatters: "Forbereder baksida lår på rask sprint og reduserer risikoen for strekk før maksimalt arbeid.", alternatives: [{ name: "Stigningsløp", reason: "Lengre, avslappede løp" }] },
  ),

  /* ---------------- STRENGTH ---------------- */

  singleArmLandmineRow: E(
    { id: "single-arm-landmine-row", category: "strength", muscleGroups: ["back", "shoulders", "core"], sets: 3, reps: "10 each side", tempo: "2-0-1-1", rest: "90 sec", videoId: "" },
    { name: "Single Arm Landmine Row", notes: "Stand side-on to the bar in a hip hinge, flat back. Pull the end of the bar towards the hip and pause briefly at the top.", whyItMatters: "Strengthens the upper back one side at a time and trains the trunk to resist rotation.", alternatives: [{ name: "One-Arm DB Row", reason: "No landmine available" }] },
    { name: "Etarms landmine-roning", notes: "Stå sidelæns til stangen i hoftebøj med lige ryg. Træk stangens ende mod hoften og hold kort i toppen.", whyItMatters: "Styrker øvre ryg én side ad gangen og træner kroppen i at modstå rotation.", alternatives: [{ name: "Etarms håndvægtsroning", reason: "Ingen landmine tilgængelig" }] },
    { name: "Enarms landmine-rodd", notes: "Stå sidledes mot stången i höftfällning med rak rygg. Dra stångänden mot höften och pausa kort i toppen.", whyItMatters: "Stärker övre ryggen en sida i taget och tränar bålen att motstå rotation.", alternatives: [{ name: "Enarms hantelrodd", reason: "Ingen landmine tillgänglig" }] },
    { name: "Enarms landmine-roing", notes: "Stå sidelengs til stanga i hoftebøy med rett rygg. Trekk stangenden mot hofta og hold kort på toppen.", whyItMatters: "Styrker øvre rygg én side om gangen og trener kroppen i å motstå rotasjon.", alternatives: [{ name: "Enarms manualroing", reason: "Ingen landmine tilgjengelig" }] },
  ),

  standingLandminePress: E(
    { id: "standing-landmine-press", category: "strength", muscleGroups: ["shoulders", "chest", "core"], sets: 3, reps: "8 each side", tempo: "2-0-1-0", rest: "90 sec", videoId: "" },
    { name: "Standing Landmine Press", notes: "Hold the bar end at shoulder height, staggered stance. Press up and forward without leaning back; squeeze the glutes.", whyItMatters: "A shoulder-friendly overhead press that links leg drive, trunk and arm — just like a punch.", alternatives: [{ name: "Half-Kneeling Landmine Press", reason: "More trunk control" }] },
    { name: "Stående landmine-pres", notes: "Hold stangens ende i skulderhøjde med forskudt fodstilling. Pres op og frem uden at læne dig tilbage; spænd ballerne.", whyItMatters: "Et skulderskånsomt pres, der forbinder ben, krop og arm — ligesom et slag.", alternatives: [{ name: "Halvknælende landmine-pres", reason: "Mere kropskontrol" }] },
    { name: "Stående landmine-press", notes: "Håll stångänden i axelhöjd med förskjuten fotställning. Pressa upp och fram utan att luta bakåt; spänn sätet.", whyItMatters: "En axelvänlig press som kopplar ihop ben, bål och arm — precis som ett slag.", alternatives: [{ name: "Halvknästående landmine-press", reason: "Mer bålkontroll" }] },
    { name: "Stående landmine-press", notes: "Hold stangenden i skulderhøyde med forskjøvet fotstilling. Press opp og frem uten å lene deg bakover; stram setet.", whyItMatters: "En skulderskånsom press som kobler bein, kropp og arm — akkurat som et slag.", alternatives: [{ name: "Halvknestående landmine-press", reason: "Mer kroppskontroll" }] },
  ),

  inclineDbBenchPress: E(
    { id: "incline-db-bench-press", category: "strength", muscleGroups: ["chest", "shoulders"], sets: 3, reps: "8", tempo: "3-0-1-0", rest: "90-120 sec", videoId: "" },
    { name: "Incline DB Bench Press", notes: "Bench at 30–45°. Lower the dumbbells under control to chest level, elbows ~45° from the body, then press up.", whyItMatters: "Builds upper chest and shoulder strength for guarding, clinching and pushing in the clinch.", alternatives: [{ name: "Incline Push-Up", reason: "No equipment" }] },
    { name: "Skråbænkpres med håndvægte", notes: "Bænk på 30–45°. Sænk håndvægtene kontrolleret til brysthøjde, albuer ca. 45° fra kroppen, og pres op.", whyItMatters: "Bygger styrke i øvre bryst og skuldre til parader og skub i nærkamp.", alternatives: [{ name: "Skrå armstrækninger", reason: "Uden udstyr" }] },
    { name: "Lutande hantelpress", notes: "Bänk på 30–45°. Sänk hantlarna kontrollerat till brösthöjd, armbågar ca 45° från kroppen, och pressa upp.", whyItMatters: "Bygger styrka i övre bröst och axlar för parader och tryck i närkamp.", alternatives: [{ name: "Lutande armhävningar", reason: "Utan utrustning" }] },
    { name: "Skråbenk med manualer", notes: "Benk på 30–45°. Senk manualene kontrollert til brysthøyde, albuer ca. 45° fra kroppen, og press opp.", whyItMatters: "Bygger styrke i øvre bryst og skuldre til parader og dytt i nærkamp.", alternatives: [{ name: "Skrå armhevinger", reason: "Uten utstyr" }] },
  ),

  dips: E(
    { id: "dips", category: "strength", muscleGroups: ["chest", "shoulders"], sets: 3, reps: "10-20", tempo: "2-0-1-0", rest: "90 sec", videoId: "" },
    { name: "Dips", notes: "Support yourself on parallel bars, shoulders down. Lower until the upper arm is about parallel to the floor, then press up.", whyItMatters: "Strong triceps and chest with only bodyweight — useful for punching power and getting up off the floor.", alternatives: [{ name: "Bench Dips", reason: "Easier variation" }] },
    { name: "Dips", notes: "Støt på parallelbarrer med skuldrene nede. Sænk dig, til overarmen er cirka vandret, og pres op.", whyItMatters: "Stærke triceps og bryst med kun kropsvægt — nyttigt for slagkraft og for at komme op fra gulvet.", alternatives: [{ name: "Bænkdips", reason: "Lettere variant" }] },
    { name: "Dips", notes: "Stöd på parallellbommar med axlarna nere. Sänk tills överarmen är ungefär vågrät och pressa upp.", whyItMatters: "Starka triceps och bröst med bara kroppsvikt — nyttigt för slagkraft och att ta sig upp från golvet.", alternatives: [{ name: "Bänkdips", reason: "Lättare variant" }] },
    { name: "Dips", notes: "Støtt deg på parallellstenger med skuldrene nede. Senk til overarmen er omtrent vannrett, og press opp.", whyItMatters: "Sterke triceps og bryst med bare kroppsvekt — nyttig for slagkraft og for å komme opp fra gulvet.", alternatives: [{ name: "Benkedips", reason: "Lettere variant" }] },
  ),

  dbLateralRaise: E(
    { id: "db-lateral-raise", category: "strength", muscleGroups: ["shoulders"], sets: 3, reps: "10-15", tempo: "2-0-1-1", rest: "60 sec", videoId: "" },
    { name: "DB Lateral Raise", notes: "Light dumbbells, slight bend in the elbows. Raise the arms out to the side to shoulder height and lower slowly.", whyItMatters: "Strengthens the side shoulder so the arms can stay up in guard for a whole fight.", alternatives: [{ name: "Band Lateral Raise", reason: "No dumbbells" }] },
    { name: "Sideløft med håndvægte", notes: "Lette håndvægte, let bøjede albuer. Løft armene ud til siden til skulderhøjde og sænk langsomt.", whyItMatters: "Styrker siden af skulderen, så armene kan holde garden oppe en hel kamp.", alternatives: [{ name: "Sideløft med elastik", reason: "Ingen håndvægte" }] },
    { name: "Sidolyft med hantlar", notes: "Lätta hantlar, lätt böjda armbågar. Lyft armarna ut åt sidan till axelhöjd och sänk långsamt.", whyItMatters: "Stärker sidan av axeln så att armarna orkar hålla garden uppe en hel match.", alternatives: [{ name: "Sidolyft med band", reason: "Inga hantlar" }] },
    { name: "Sidehev med manualer", notes: "Lette manualer, lett bøyde albuer. Løft armene ut til siden til skulderhøyde og senk sakte.", whyItMatters: "Styrker siden av skulderen så armene orker å holde garden oppe en hel kamp.", alternatives: [{ name: "Sidehev med strikk", reason: "Ingen manualer" }] },
  ),

  dbShoulderPress: E(
    { id: "db-shoulder-press", category: "strength", muscleGroups: ["shoulders", "core"], sets: 3, reps: "8", tempo: "2-0-1-0", rest: "90 sec", videoId: "" },
    { name: "DB Shoulder Press", notes: "Seated or standing, dumbbells at shoulder height. Press overhead without arching the lower back, lower under control.", whyItMatters: "Builds overhead shoulder strength and stability, protecting the shoulder in falls and clinches.", alternatives: [{ name: "Standing Landmine Press", reason: "More shoulder-friendly" }] },
    { name: "Skulderpres med håndvægte", notes: "Siddende eller stående, håndvægte i skulderhøjde. Pres over hovedet uden at svaje i lænden, og sænk kontrolleret.", whyItMatters: "Bygger styrke og stabilitet i skulderen, som beskytter ved fald og nærkamp.", alternatives: [{ name: "Stående landmine-pres", reason: "Mere skulderskånsom" }] },
    { name: "Axelpress med hantlar", notes: "Sittande eller stående, hantlar i axelhöjd. Pressa över huvudet utan att svanka och sänk kontrollerat.", whyItMatters: "Bygger styrka och stabilitet i axeln som skyddar vid fall och närkamp.", alternatives: [{ name: "Stående landmine-press", reason: "Mer axelvänlig" }] },
    { name: "Skulderpress med manualer", notes: "Sittende eller stående, manualer i skulderhøyde. Press over hodet uten å svaie i korsryggen, og senk kontrollert.", whyItMatters: "Bygger styrke og stabilitet i skulderen som beskytter ved fall og nærkamp.", alternatives: [{ name: "Stående landmine-press", reason: "Mer skulderskånsom" }] },
  ),

  legExtension: E(
    { id: "leg-extension", category: "strength", muscleGroups: ["quads"], sets: 2, reps: "12-15", tempo: "2-0-1-1", rest: "60-90 sec", videoId: "" },
    { name: "Leg Extension", notes: "Sit in the machine with the pad on the lower shin. Straighten the knees fully, pause, lower slowly.", whyItMatters: "Isolates the quads and strengthens the knee tendon — important for landings and snapping kicks.", alternatives: [{ name: "Reverse Nordic", reason: "No machine" }] },
    { name: "Benstræk i maskine", notes: "Sid i maskinen med puden på nederste skinneben. Stræk knæene helt, hold kort og sænk langsomt.", whyItMatters: "Isolerer forlåret og styrker knæsenen — vigtigt for landinger og piskende spark.", alternatives: [{ name: "Omvendt nordic", reason: "Ingen maskine" }] },
    { name: "Bensträckare", notes: "Sitt i maskinen med dynan på nedre smalbenet. Sträck knäna helt, pausa och sänk långsamt.", whyItMatters: "Isolerar framsida lår och stärker knäsenan — viktigt för landningar och snärtiga sparkar.", alternatives: [{ name: "Omvänd nordic", reason: "Ingen maskin" }] },
    { name: "Beinspark i maskin", notes: "Sitt i maskinen med puten på nedre leggen. Strekk knærne helt, hold kort og senk sakte.", whyItMatters: "Isolerer forsida lår og styrker knesenen — viktig for landinger og piskende spark.", alternatives: [{ name: "Omvendt nordic", reason: "Ingen maskin" }] },
  ),

  seatedCalfRaise: E(
    { id: "seated-calf-raise", category: "strength", muscleGroups: ["calves"], sets: 2, reps: "15-20", tempo: "2-1-1-1", rest: "60 sec", videoId: "" },
    { name: "Seated Calf Raise", notes: "Sit with knees bent at 90° and weight on the thighs. Rise high on the toes, pause, lower to a full stretch.", whyItMatters: "Targets the deep calf muscle (soleus), which absorbs load in bouncing footwork and landings.", alternatives: [{ name: "Bent-Knee Wall Calf Raise", reason: "No machine" }] },
    { name: "Siddende tåløft", notes: "Sid med knæene bøjet 90° og vægt på lårene. Gå højt op på tæerne, hold kort og sænk til fuldt stræk.", whyItMatters: "Rammer den dybe lægmuskel (soleus), som tager belastningen i fjedrende fodarbejde og landinger.", alternatives: [{ name: "Tåløft med bøjede knæ ved væg", reason: "Ingen maskine" }] },
    { name: "Sittande tåhävningar", notes: "Sitt med knäna böjda 90° och vikt på låren. Gå högt upp på tårna, pausa och sänk till full stretch.", whyItMatters: "Träffar den djupa vadmuskeln (soleus), som tar belastningen i fjädrande fotarbete och landningar.", alternatives: [{ name: "Tåhävningar med böjda knän vid vägg", reason: "Ingen maskin" }] },
    { name: "Sittende tåhev", notes: "Sitt med knærne bøyd 90° og vekt på lårene. Gå høyt opp på tærne, hold kort og senk til full strekk.", whyItMatters: "Treffer den dype leggmuskelen (soleus), som tar belastningen i fjærende fotarbeid og landinger.", alternatives: [{ name: "Tåhev med bøyde knær ved vegg", reason: "Ingen maskin" }] },
  ),

  /* ---------------- ISOMETRIC & PREHAB ---------------- */

  lungeIsoHoldHeelsElevated: E(
    { id: "lunge-iso-hold-heels-elevated", category: "mobility", muscleGroups: ["quads", "glutes"], sets: 3, reps: "45 sec each side", rest: "60 sec", videoId: "" },
    { name: "Lunge Iso Hold (heels elevated)", notes: "Front heel on a small plate or wedge. Sink into a lunge with the front knee forward over the toes and hold still.", whyItMatters: "Loads the knee tendon safely and builds strength in deep knee angles — good prevention for jumper's knee.", alternatives: [{ name: "Split Squat Iso Hold", reason: "Flat-foot variation" }] },
    { name: "Isometrisk udfaldshold (hævede hæle)", notes: "Forreste hæl på en lille skive eller kile. Sænk dig i et udfald med knæet frem over tæerne og hold stille.", whyItMatters: "Belaster knæsenen sikkert og bygger styrke i dybe knævinkler — god forebyggelse af springerknæ.", alternatives: [{ name: "Isometrisk split squat", reason: "Med flade fødder" }] },
    { name: "Isometriskt utfallshåll (upphöjda hälar)", notes: "Främre hälen på en liten viktskiva eller kil. Sjunk ner i ett utfall med knät fram över tårna och håll still.", whyItMatters: "Belastar knäsenan säkert och bygger styrka i djupa knävinklar — bra förebyggande mot hopparknä.", alternatives: [{ name: "Isometrisk split squat", reason: "Med plana fötter" }] },
    { name: "Isometrisk utfallshold (hevede hæler)", notes: "Fremre hæl på en liten skive eller kile. Senk deg i et utfall med kneet fram over tærne og hold stille.", whyItMatters: "Belaster knesenen trygt og bygger styrke i dype knevinkler — god forebygging av hopperkne.", alternatives: [{ name: "Isometrisk split squat", reason: "Med flate føtter" }] },
  ),

  kneeExtensionIsometric45: E(
    { id: "knee-extension-isometric-45", category: "mobility", muscleGroups: ["quads"], sets: 3, reps: "45 sec", rest: "60-90 sec", videoId: "" },
    { name: "Knee Extension Isometric 45°", notes: "In a leg extension machine (or against a band), hold the knee at about 45° bend and push hard into the pad without moving.", whyItMatters: "Reduces knee pain and keeps the patellar tendon strong during heavy training periods.", alternatives: [{ name: "Wall Sit", reason: "No machine" }] },
    { name: "Isometrisk benstræk 45°", notes: "I benstrækmaskine (eller mod elastik) holdes knæet i ca. 45° bøjning, og du presser hårdt mod puden uden bevægelse.", whyItMatters: "Mindsker knæsmerter og holder knæsenen stærk i perioder med hård træning.", alternatives: [{ name: "Vægsid", reason: "Ingen maskine" }] },
    { name: "Isometrisk bensträck 45°", notes: "I bensträckarmaskin (eller mot band) håll knät i ca 45° böjning och tryck hårt mot dynan utan att röra dig.", whyItMatters: "Minskar knäsmärta och håller knäsenan stark under perioder med hård träning.", alternatives: [{ name: "Väggsittning", reason: "Ingen maskin" }] },
    { name: "Isometrisk beinspark 45°", notes: "I beinsparkmaskin (eller mot strikk) holdes kneet i ca. 45° bøy, og du presser hardt mot puten uten bevegelse.", whyItMatters: "Reduserer knesmerter og holder knesenen sterk i perioder med hard trening.", alternatives: [{ name: "Veggsitt", reason: "Ingen maskin" }] },
  ),

  singleLegBridgeIsometric: E(
    { id: "single-leg-bridge-isometric", category: "mobility", muscleGroups: ["glutes", "hamstrings"], sets: 2, reps: "4 × 20 sec each side", rest: "45 sec", videoId: "" },
    { name: "Single Leg Bridge Isometric", notes: "Lie on your back, one foot on the floor, other leg straight. Lift the hips level and hold, without letting the pelvis drop.", whyItMatters: "Strengthens glutes and hamstrings in a safe position — key protection against hamstring strains.", alternatives: [{ name: "Glute Bridge Hold", reason: "Two legs, easier" }] },
    { name: "Isometrisk etbens-bro", notes: "Lig på ryggen med én fod i gulvet og det andet ben strakt. Løft hoften vandret og hold, uden at bækkenet falder.", whyItMatters: "Styrker baller og baglår i en sikker position — vigtig beskyttelse mod baglårsskader.", alternatives: [{ name: "Isometrisk bro på to ben", reason: "Lettere" }] },
    { name: "Isometrisk enbensbrygga", notes: "Ligg på rygg med en fot i golvet och andra benet rakt. Lyft höften vågrätt och håll utan att bäckenet sjunker.", whyItMatters: "Stärker säte och baksida lår i ett säkert läge — viktigt skydd mot baksidesskador.", alternatives: [{ name: "Isometrisk brygga på två ben", reason: "Lättare" }] },
    { name: "Isometrisk ettbeins-bro", notes: "Ligg på ryggen med én fot i gulvet og det andre beinet strakt. Løft hofta vannrett og hold uten at bekkenet faller.", whyItMatters: "Styrker sete og baksida lår i en trygg posisjon — viktig beskyttelse mot strekkskader.", alternatives: [{ name: "Isometrisk bro på to bein", reason: "Lettere" }] },
  ),

  sidePlankHipAbduction: E(
    { id: "side-plank-hip-abduction", category: "mobility", muscleGroups: ["glutes", "core"], sets: 3, reps: "10 each side", tempo: "1-1-1-0", rest: "45 sec", videoId: "" },
    { name: "Side Plank Hip Abduction", notes: "Hold a side plank on the elbow and lift the top leg up and down slowly while the hips stay high.", whyItMatters: "Strengthens the side hip and trunk that stabilise the standing leg during every kick.", alternatives: [{ name: "Side-Lying Leg Raise", reason: "Easier" }] },
    { name: "Sideplanke med benløft", notes: "Hold en sideplanke på albuen og løft det øverste ben langsomt op og ned, mens hoften holdes høj.", whyItMatters: "Styrker hofte og side, der stabiliserer standbenet i hvert eneste spark.", alternatives: [{ name: "Sideliggende benløft", reason: "Lettere" }] },
    { name: "Sidoplanka med benlyft", notes: "Håll en sidoplanka på armbågen och lyft det övre benet långsamt upp och ner medan höften hålls hög.", whyItMatters: "Stärker höft och sida som stabiliserar stödbenet i varje spark.", alternatives: [{ name: "Sidliggande benlyft", reason: "Lättare" }] },
    { name: "Sideplanke med beinløft", notes: "Hold en sideplanke på albuen og løft det øverste beinet sakte opp og ned mens hofta holdes høy.", whyItMatters: "Styrker hofte og side som stabiliserer støttebeinet i hvert spark.", alternatives: [{ name: "Sideliggende beinløft", reason: "Lettere" }] },
  ),

  hipFlexorSitUp: E(
    { id: "hip-flexor-sit-up", category: "strength", muscleGroups: ["hip-flexors", "core"], sets: 3, reps: "10", tempo: "2-0-1-0", rest: "60 sec", videoId: "" },
    { name: "Hip Flexor Sit Up", notes: "Feet anchored, knees bent. Sit all the way up with a long spine and lower slowly. Add a plate on the chest to progress.", whyItMatters: "Strong hip flexors lift the knee faster and higher — the start of every kick.", alternatives: [{ name: "Hanging Knee Raise", reason: "More hip-flexor focus" }] },
    { name: "Sit-up for hoftebøjere", notes: "Fødderne fastholdt, knæene bøjet. Rul helt op med lang ryg og sænk langsomt. Læg en skive på brystet for progression.", whyItMatters: "Stærke hoftebøjere løfter knæet hurtigere og højere — starten på hvert spark.", alternatives: [{ name: "Hængende knæløft", reason: "Mere fokus på hoftebøjere" }] },
    { name: "Sit-up för höftböjare", notes: "Fötterna fixerade, knäna böjda. Res dig hela vägen upp med lång rygg och sänk långsamt. Lägg en viktskiva på bröstet för progression.", whyItMatters: "Starka höftböjare lyfter knät snabbare och högre — starten på varje spark.", alternatives: [{ name: "Hängande knälyft", reason: "Mer fokus på höftböjare" }] },
    { name: "Sit-up for hoftebøyere", notes: "Føttene festet, knærne bøyd. Rull helt opp med lang rygg og senk sakte. Legg en skive på brystet for progresjon.", whyItMatters: "Sterke hoftebøyere løfter kneet raskere og høyere — starten på hvert spark.", alternatives: [{ name: "Hengende kneløft", reason: "Mer fokus på hoftebøyere" }] },
  ),
};
