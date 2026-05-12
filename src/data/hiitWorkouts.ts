type LocaleKey = "da" | "sv" | "de" | "ar" | "no";

export interface HiitInterval {
  name: string;
  korean?: string;
  type: "WORK" | "REST";
  duration: number; // seconds
  description?: string;
  nameLocales?: Partial<Record<LocaleKey, string>>;
  descLocales?: Partial<Record<LocaleKey, string>>;
}

export interface HiitWorkout {
  id: string;
  name: string;
  category: "kicks" | "conditioning" | "footwork" | "sparring";
  level: "beginner" | "intermediate" | "advanced";
  description: string;
  intervals: HiitInterval[];
  nameLocales?: Partial<Record<LocaleKey, string>>;
  descLocales?: Partial<Record<LocaleKey, string>>;
}

const REST_NAME_LOC: Partial<Record<LocaleKey, string>> = {
  da: "Hvile", sv: "Vila", de: "Pause", ar: "راحة", no: "Hvile",
};
const REST_DESC_LOC: Partial<Record<LocaleKey, string>> = {
  da: "Let fodarbejde, træk vejret",
  sv: "Lätt fotarbete, andas",
  de: "Leichte Beinarbeit, atmen",
  ar: "حركة قدمين خفيفة، تنفّس",
  no: "Lett fotarbeid, pust",
};
const COOL_NAME_LOC: Partial<Record<LocaleKey, string>> = {
  da: "Nedkøling", sv: "Nedvarvning", de: "Cool-down", ar: "تهدئة", no: "Nedtrapping",
};

const REST = (duration = 15): HiitInterval => ({
  name: "Rest",
  korean: "회복",
  type: "REST",
  duration,
  description: "Light footwork, breathe",
  nameLocales: REST_NAME_LOC,
  descLocales: REST_DESC_LOC,
});

export const HIIT_WORKOUTS: HiitWorkout[] = [
  {
    id: "tabata-kicks",
    name: "Tabata Kicks",
    category: "kicks",
    level: "intermediate",
    description: "Classic 8-round Tabata with alternating roundhouse kicks. 20s max effort, 10s rest.",
    nameLocales: { da: "Tabata-spark", sv: "Tabata-spark", de: "Tabata-Kicks", ar: "تاباتا ركلات", no: "Tabata-spark" },
    descLocales: {
      da: "Klassisk 8-runders Tabata med skiftende rundkick. 20s maks indsats, 10s hvile.",
      sv: "Klassisk 8-rundas Tabata med växlande rundspark. 20s maxinsats, 10s vila.",
      de: "Klassisches 8-Runden-Tabata mit abwechselnden Rundkicks. 20s Volllast, 10s Pause.",
      ar: "تاباتا كلاسيكية من 8 جولات مع ركلات دائرية متبادلة. 20 ثانية بأقصى جهد، 10 ثوانٍ راحة.",
      no: "Klassisk 8-runders Tabata med vekslende rundkick. 20s maksinnsats, 10s hvile.",
    },
    intervals: Array.from({ length: 8 }).flatMap(() => [
      {
        name: "Dollyo Chagi",
        korean: "돌려차기",
        type: "WORK" as const,
        duration: 20,
        description: "Roundhouse kicks, alternate legs, max speed",
        nameLocales: { da: "Rundkick", sv: "Rundspark", de: "Rundkick", ar: "ركلة دائرية", no: "Rundkick" },
        descLocales: {
          da: "Rundkick, skift ben, maks fart",
          sv: "Rundspark, växla ben, maxfart",
          de: "Rundkicks, Beine wechseln, max. Tempo",
          ar: "ركلات دائرية، بدّل الساقين، أقصى سرعة",
          no: "Rundkick, bytt bein, maks fart",
        },
      },
      { ...REST(10) },
    ]),
  },
  {
    id: "olympic-blitz",
    name: "Olympic Blitz",
    category: "kicks",
    level: "advanced",
    description: "Five Olympic-style techniques back-to-back. Build explosive power and stamina.",
    nameLocales: { da: "Olympisk blitz", sv: "Olympisk blixt", de: "Olympia-Blitz", ar: "هجوم أولمبي", no: "Olympisk blitz" },
    descLocales: {
      da: "Fem teknikker i olympisk stil i træk. Byg eksplosiv kraft og udholdenhed.",
      sv: "Fem olympiska tekniker i följd. Bygg explosiv kraft och uthållighet.",
      de: "Fünf Techniken im olympischen Stil hintereinander. Baut explosive Kraft und Ausdauer auf.",
      ar: "خمس تقنيات أولمبية متتالية. ابنِ قوة انفجارية وقدرة على التحمّل.",
      no: "Fem olympiske teknikker etter hverandre. Bygg eksplosiv kraft og utholdenhet.",
    },
    intervals: [
      { name: "Ap Chagi Blitz", korean: "앞차기", type: "WORK", duration: 30, description: "Explosive front kicks, alternate legs",
        nameLocales: { da: "Fremadkick blitz", sv: "Framåtspark blixt", de: "Vorwärtskick-Blitz", ar: "ركلة أمامية متفجرة", no: "Fremadkick blitz" },
        descLocales: { da: "Eksplosive fremadkick, skift ben", sv: "Explosiva framåtspark, växla ben", de: "Explosive Vorwärtskicks, Beine wechseln", ar: "ركلات أمامية متفجرة، بدّل الساقين", no: "Eksplosive fremadkick, bytt bein" } },
      REST(15),
      { name: "Dollyo Chagi Combos", korean: "돌려차기", type: "WORK", duration: 30, description: "3-kick roundhouse combos, both sides",
        nameLocales: { da: "Rundkick-kombinationer", sv: "Rundspark-kombos", de: "Rundkick-Kombos", ar: "تركيبات ركلة دائرية", no: "Rundkick-kombinasjoner" },
        descLocales: { da: "3-kicks rundkick-kombinationer, begge sider", sv: "3-sparks kombinationer, båda sidor", de: "3-Kick-Rundkick-Kombos, beide Seiten", ar: "تركيبات 3 ركلات دائرية، كلا الجانبين", no: "3-spark rundkick-kombinasjoner, begge sider" } },
      REST(15),
      { name: "Dwi Chagi Power", korean: "뒤차기", type: "WORK", duration: 30, description: "Back kick explosions, drive heel through target",
        nameLocales: { da: "Bagkick kraft", sv: "Bakåtspark kraft", de: "Rückwärtskick-Power", ar: "قوة الركلة الخلفية", no: "Bagkick kraft" },
        descLocales: { da: "Eksplosive bagkick, kør hælen gennem målet", sv: "Explosiva bakåtspark, driv hälen genom målet", de: "Explosive Rückwärtskicks, Ferse durchs Ziel treiben", ar: "ركلات خلفية متفجرة، ادفع الكعب عبر الهدف", no: "Eksplosive bagkick, driv hælen gjennom målet" } },
      REST(15),
      { name: "Narae Chagi", korean: "나래차기", type: "WORK", duration: 30, description: "Jump double kicks, explosive vertical",
        nameLocales: { da: "Hoppe-dobbeltspark", sv: "Hopp-dubbelspark", de: "Sprung-Doppelkick", ar: "ركلة قفز مزدوجة", no: "Hopp-dobbeltspark" },
        descLocales: { da: "Hoppe-dobbeltspark, eksplosiv vertikal", sv: "Hopp-dubbelspark, explosiv vertikal", de: "Sprung-Doppelkicks, explosiv vertikal", ar: "ركلات قفز مزدوجة، عمودي متفجر", no: "Hopp-dobbeltspark, eksplosiv vertikal" } },
      REST(15),
      { name: "Gyeorugi Blitz", korean: "겨루기", type: "WORK", duration: 30, description: "Shadow sparring — full combinations",
        nameLocales: { da: "Skygge-sparring blitz", sv: "Skugg-sparring blixt", de: "Schatten-Sparring-Blitz", ar: "مبارزة وهمية", no: "Skygge-sparring blitz" },
        descLocales: { da: "Skygge-sparring — fulde kombinationer", sv: "Skugg-sparring — fulla kombinationer", de: "Schatten-Sparring — volle Kombinationen", ar: "مبارزة وهمية — تركيبات كاملة", no: "Skygge-sparring — fulle kombinasjoner" } },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Deep breathing, light stretch",
        nameLocales: COOL_NAME_LOC,
        descLocales: { da: "Dyb vejrtrækning, let stræk", sv: "Djupandning, lätt stretch", de: "Tiefes Atmen, leichtes Dehnen", ar: "تنفّس عميق، تمدّد خفيف", no: "Dyp pust, lett tøying" } },
    ],
  },
  {
    id: "footwork-flow",
    name: "Footwork Flow",
    category: "footwork",
    level: "beginner",
    description: "Develop ring movement and rhythm. Light intervals focused on stance switching and angles.",
    nameLocales: { da: "Fodarbejde-flow", sv: "Fotarbete-flöde", de: "Beinarbeit-Flow", ar: "تدفق العمل بالقدمين", no: "Fotarbeid-flyt" },
    descLocales: {
      da: "Udvikl ringbevægelse og rytme. Lette intervaller med fokus på stillingsskift og vinkler.",
      sv: "Utveckla ringrörelse och rytm. Lätta intervaller med fokus på stansbyte och vinklar.",
      de: "Entwickle Ringbewegung und Rhythmus. Leichte Intervalle mit Fokus auf Stellungswechsel und Winkel.",
      ar: "طوّر الحركة في الحلبة والإيقاع. فترات خفيفة تركّز على تبديل الوقفة والزوايا.",
      no: "Utvikle ringbevegelse og rytme. Lette intervaller med fokus på stillingsbytte og vinkler.",
    },
    intervals: [
      { name: "Switch Stance", korean: "스위치", type: "WORK", duration: 25, description: "Rapid stance switches in place",
        nameLocales: { da: "Skift stilling", sv: "Byt ställning", de: "Stellungswechsel", ar: "تبديل الوقفة", no: "Bytt stilling" },
        descLocales: { da: "Hurtige stillingsskift på stedet", sv: "Snabba ställningsbyten på plats", de: "Schnelle Stellungswechsel am Platz", ar: "تبديل سريع للوقفة في المكان", no: "Raske stillingsbytter på stedet" } },
      REST(20),
      { name: "Lateral Slides", korean: "사이드", type: "WORK", duration: 25, description: "Side-to-side ring movement",
        nameLocales: { da: "Sidegliden", sv: "Sidoglidning", de: "Seitliches Gleiten", ar: "انزلاق جانبي", no: "Sidegliding" },
        descLocales: { da: "Side-til-side ringbevægelse", sv: "Sida-till-sida ringrörelse", de: "Seitliche Ringbewegung", ar: "حركة جانبية في الحلبة", no: "Side-til-side ringbevegelse" } },
      REST(20),
      { name: "Step-In Step-Out", korean: "스텝", type: "WORK", duration: 25, description: "Range control, in and out",
        nameLocales: { da: "Ind-ud trin", sv: "In-ut steg", de: "Rein-Raus-Schritt", ar: "خطوة دخول وخروج", no: "Inn-ut steg" },
        descLocales: { da: "Afstandskontrol, ind og ud", sv: "Avståndskontroll, in och ut", de: "Distanzkontrolle, rein und raus", ar: "التحكم في المدى، دخول وخروج", no: "Avstandskontroll, inn og ut" } },
      REST(20),
      { name: "Cut Step Drill", korean: "이단", type: "WORK", duration: 25, description: "Cut step into front leg attack",
        nameLocales: { da: "Cut step øvelse", sv: "Cut step-övning", de: "Cut-Step-Drill", ar: "تمرين كات ستيب", no: "Cut step-øvelse" },
        descLocales: { da: "Cut step ind i forrest-bens angreb", sv: "Cut step in i frambens-attack", de: "Cut-Step in den Frontbein-Angriff", ar: "كات ستيب لهجوم الساق الأمامية", no: "Cut step inn i frambens-angrep" } },
      REST(20),
      { name: "Pivot & Counter", korean: "피벗", type: "WORK", duration: 25, description: "Pivot off line, counter with round kick",
        nameLocales: { da: "Pivot & kontra", sv: "Pivot & kontra", de: "Pivot & Konter", ar: "محور ومضاد", no: "Pivot & kontring" },
        descLocales: { da: "Pivot af linjen, kontra med rundkick", sv: "Pivot från linjen, kontra med rundspark", de: "Pivot aus der Linie, Konter mit Rundkick", ar: "محور خارج الخط، مضاد بركلة دائرية", no: "Pivot ut av linjen, kontre med rundkick" } },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Walk it out, deep breaths",
        nameLocales: COOL_NAME_LOC,
        descLocales: { da: "Gå det ud, dybe vejrtrækninger", sv: "Gå av det, djupa andetag", de: "Auslaufen, tiefe Atemzüge", ar: "امشِ للراحة، أنفاس عميقة", no: "Gå det ut, dype åndedrag" } },
    ],
  },
  {
    id: "sparring-rounds",
    name: "Sparring Rounds",
    category: "sparring",
    level: "advanced",
    description: "Three competition-length rounds (90s) with active recovery. Mimics match intensity.",
    nameLocales: { da: "Sparringsrunder", sv: "Sparringsrundor", de: "Sparring-Runden", ar: "جولات مبارزة", no: "Sparringsrunder" },
    descLocales: {
      da: "Tre konkurrencelange runder (90s) med aktiv restitution. Efterligner kampintensitet.",
      sv: "Tre tävlingslånga rundor (90s) med aktiv återhämtning. Efterliknar matchintensitet.",
      de: "Drei wettkampflange Runden (90s) mit aktiver Erholung. Imitiert Kampfintensität.",
      ar: "ثلاث جولات بطول المنافسة (90 ثانية) مع تعافٍ نشط. تحاكي شدّة المباراة.",
      no: "Tre konkurranselange runder (90s) med aktiv restitusjon. Etterligner kampintensitet.",
    },
    intervals: [
      { name: "Round 1", korean: "1회전", type: "WORK", duration: 90, description: "Shadow sparring — open & score",
        nameLocales: { da: "Runde 1", sv: "Rond 1", de: "Runde 1", ar: "الجولة 1", no: "Runde 1" },
        descLocales: { da: "Skygge-sparring — åbn & scor", sv: "Skugg-sparring — öppna & poängsätt", de: "Schatten-Sparring — öffnen & punkten", ar: "مبارزة وهمية — افتح وسجّل", no: "Skygge-sparring — åpne & score" } },
      { name: "Active Rest", korean: "휴식", type: "REST", duration: 60, description: "Slow footwork, hydrate",
        nameLocales: { da: "Aktiv hvile", sv: "Aktiv vila", de: "Aktive Pause", ar: "راحة نشطة", no: "Aktiv hvile" },
        descLocales: { da: "Langsomt fodarbejde, drik vand", sv: "Långsamt fotarbete, drick vatten", de: "Langsame Beinarbeit, trinken", ar: "حركة قدمين بطيئة، اشرب الماء", no: "Sakte fotarbeid, drikk vann" } },
      { name: "Round 2", korean: "2회전", type: "WORK", duration: 90, description: "Counter-attacks & defence",
        nameLocales: { da: "Runde 2", sv: "Rond 2", de: "Runde 2", ar: "الجولة 2", no: "Runde 2" },
        descLocales: { da: "Modangreb & forsvar", sv: "Motanfall & försvar", de: "Konter & Verteidigung", ar: "هجمات مضادة ودفاع", no: "Motangrep & forsvar" } },
      { name: "Active Rest", korean: "휴식", type: "REST", duration: 60, description: "Slow footwork, hydrate",
        nameLocales: { da: "Aktiv hvile", sv: "Aktiv vila", de: "Aktive Pause", ar: "راحة نشطة", no: "Aktiv hvile" },
        descLocales: { da: "Langsomt fodarbejde, drik vand", sv: "Långsamt fotarbete, drick vatten", de: "Langsame Beinarbeit, trinken", ar: "حركة قدمين بطيئة، اشرب الماء", no: "Sakte fotarbeid, drikk vann" } },
      { name: "Round 3", korean: "3회전", type: "WORK", duration: 90, description: "Empty the tank — full combinations",
        nameLocales: { da: "Runde 3", sv: "Rond 3", de: "Runde 3", ar: "الجولة 3", no: "Runde 3" },
        descLocales: { da: "Tøm tanken — fulde kombinationer", sv: "Töm tanken — fulla kombinationer", de: "Tank leeren — volle Kombinationen", ar: "أفرغ الخزان — تركيبات كاملة", no: "Tøm tanken — fulle kombinasjoner" } },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 60, description: "Deep breathing, stretch",
        nameLocales: COOL_NAME_LOC,
        descLocales: { da: "Dyb vejrtrækning, stræk", sv: "Djupandning, stretch", de: "Tiefes Atmen, dehnen", ar: "تنفّس عميق، تمدّد", no: "Dyp pust, tøying" } },
    ],
  },
  {
    id: "conditioning-emom",
    name: "Conditioning EMOM",
    category: "conditioning",
    level: "intermediate",
    description: "Every minute on the minute: 40s burpees / kicks, 20s rest. Six tough rounds.",
    nameLocales: { da: "Kondi EMOM", sv: "Kondition EMOM", de: "Kondi-EMOM", ar: "تكييف EMOM", no: "Kondi EMOM" },
    descLocales: {
      da: "Hvert minut på minuttet: 40s burpees/spark, 20s hvile. Seks hårde runder.",
      sv: "Varje minut på minuten: 40s burpees/spark, 20s vila. Sex tuffa rundor.",
      de: "Jede Minute zur Minute: 40s Burpees/Kicks, 20s Pause. Sechs harte Runden.",
      ar: "كل دقيقة في الدقيقة: 40 ثانية بيربيز/ركلات، 20 ثانية راحة. ست جولات صعبة.",
      no: "Hvert minutt på minuttet: 40s burpees/spark, 20s hvile. Seks tøffe runder.",
    },
    intervals: Array.from({ length: 6 }).flatMap((_, i) => [
      i % 2 === 0
        ? {
            name: "Burpee Kicks",
            korean: "버피",
            type: "WORK" as const,
            duration: 40,
            description: "Burpee + roundhouse kick",
            nameLocales: { da: "Burpee-spark", sv: "Burpee-spark", de: "Burpee-Kicks", ar: "بيربيز مع ركلات", no: "Burpee-spark" },
            descLocales: { da: "Burpee + rundkick", sv: "Burpee + rundspark", de: "Burpee + Rundkick", ar: "بيربي + ركلة دائرية", no: "Burpee + rundkick" },
          }
        : {
            name: "Squat Jumps",
            korean: "점프",
            type: "WORK" as const,
            duration: 40,
            description: "Explosive squat jumps",
            nameLocales: { da: "Squat-hop", sv: "Hoppknäböj", de: "Sprungkniebeugen", ar: "قفز القرفصاء", no: "Spretthopp" },
            descLocales: { da: "Eksplosive squat-hop", sv: "Explosiva hoppknäböj", de: "Explosive Sprungkniebeugen", ar: "قفز قرفصاء متفجر", no: "Eksplosive spretthopp" },
          },
      { ...REST(20) },
    ]),
  },
  {
    id: "speed-spike",
    name: "Speed Spike",
    category: "kicks",
    level: "beginner",
    description: "Short 15s sprints of single technique. Perfect for warm-up or speed development.",
    nameLocales: { da: "Hastighedsspids", sv: "Hastighetsspik", de: "Speed-Spike", ar: "نوبة سرعة", no: "Hastighetsspiss" },
    descLocales: {
      da: "Korte 15s sprints af enkelt teknik. Perfekt til opvarmning eller hastighedsudvikling.",
      sv: "Korta 15s sprintar av en teknik. Perfekt för uppvärmning eller hastighetsutveckling.",
      de: "Kurze 15s-Sprints einer Technik. Ideal zum Aufwärmen oder für Geschwindigkeitsentwicklung.",
      ar: "ركضات قصيرة 15 ثانية لتقنية واحدة. مثالية للإحماء أو تطوير السرعة.",
      no: "Korte 15s sprinter med én teknikk. Perfekt for oppvarming eller hastighetsutvikling.",
    },
    intervals: [
      { name: "Front Leg Round", korean: "앞다리", type: "WORK", duration: 15, description: "Front leg roundhouse spam",
        nameLocales: { da: "Forrest-bens rundkick", sv: "Framben rundspark", de: "Frontbein-Rundkick", ar: "ركلة دائرية بالساق الأمامية", no: "Frambein rundkick" },
        descLocales: { da: "Forrest-bens rundkick spam", sv: "Framben rundspark spam", de: "Frontbein-Rundkick-Spam", ar: "تكرار ركلة دائرية بالساق الأمامية", no: "Frambein rundkick-spam" } },
      REST(15),
      { name: "Rear Leg Round", korean: "뒷다리", type: "WORK", duration: 15, description: "Rear leg roundhouse, full hip",
        nameLocales: { da: "Bagest-bens rundkick", sv: "Bakben rundspark", de: "Hinterbein-Rundkick", ar: "ركلة دائرية بالساق الخلفية", no: "Bakbein rundkick" },
        descLocales: { da: "Bagest-bens rundkick, fuld hofte", sv: "Bakben rundspark, full höft", de: "Hinterbein-Rundkick, volle Hüfte", ar: "ركلة دائرية بالساق الخلفية، الورك بالكامل", no: "Bakbein rundkick, full hofte" } },
      REST(15),
      { name: "Double Round", korean: "더블", type: "WORK", duration: 15, description: "Two kicks per side, alternate",
        nameLocales: { da: "Dobbelt rundkick", sv: "Dubbelt rundspark", de: "Doppel-Rundkick", ar: "ركلة دائرية مزدوجة", no: "Dobbel rundkick" },
        descLocales: { da: "To spark per side, skift", sv: "Två spark per sida, växla", de: "Zwei Kicks pro Seite, wechseln", ar: "ركلتان لكل جانب، بدّل", no: "To spark per side, bytt" } },
      REST(15),
      { name: "Switch Round", korean: "스위치", type: "WORK", duration: 15, description: "Switch step into round kick",
        nameLocales: { da: "Switch rundkick", sv: "Switch rundspark", de: "Switch-Rundkick", ar: "ركلة دائرية بتبديل", no: "Switch rundkick" },
        descLocales: { da: "Switch step ind i rundkick", sv: "Switch-steg in i rundspark", de: "Switch-Step in den Rundkick", ar: "خطوة تبديل لركلة دائرية", no: "Switch-steg inn i rundkick" } },
      REST(15),
      { name: "Push Kick", korean: "밀어차기", type: "WORK", duration: 15, description: "Push kick to break range",
        nameLocales: { da: "Skubbespark", sv: "Tryckspark", de: "Stoßkick", ar: "ركلة دفع", no: "Dyttespark" },
        descLocales: { da: "Skubbespark for at bryde afstand", sv: "Tryckspark för att bryta avstånd", de: "Stoßkick zum Brechen der Distanz", ar: "ركلة دفع لكسر المسافة", no: "Dyttespark for å bryte avstand" } },
      REST(15),
      { name: "Spin Hook", korean: "뒤후려차기", type: "WORK", duration: 15, description: "Spin hook kick, controlled",
        nameLocales: { da: "Drejespark", sv: "Snurrspark", de: "Drehhammer", ar: "ركلة دوران خطافية", no: "Dreieskick" },
        descLocales: { da: "Drejespark, kontrolleret", sv: "Snurrspark, kontrollerad", de: "Drehhammer, kontrolliert", ar: "ركلة دوران خطافية، مضبوطة", no: "Dreieskick, kontrollert" } },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Stretch, breathe",
        nameLocales: COOL_NAME_LOC,
        descLocales: { da: "Stræk, træk vejret", sv: "Stretch, andas", de: "Dehnen, atmen", ar: "تمدّد، تنفّس", no: "Tøying, pust" } },
    ],
  },
];

export const HIIT_CATEGORY_LABELS: Record<HiitWorkout["category"], string> = {
  kicks: "Kicks",
  conditioning: "Conditioning",
  footwork: "Footwork",
  sparring: "Sparring",
};
