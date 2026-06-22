// Coach-specific mental review questions.
// 6 categories × 3 questions = 18 items. Same scoring shape as athlete questions
// so the assessment UI can reuse the average-per-category logic.

export interface CoachLangText {
  en: string;
  da: string;
  sv: string;
  de: string;
  ar: string;
  no: string;
}

export interface CoachMentalQuestion {
  id: string;
  category: string;
  text: CoachLangText;
  options: { value: number; label: CoachLangText }[];
}

const opts = (
  one: CoachLangText,
  two: CoachLangText,
  three: CoachLangText,
  four: CoachLangText,
  five: CoachLangText,
): { value: number; label: CoachLangText }[] => [
  { value: 1, label: one },
  { value: 2, label: two },
  { value: 3, label: three },
  { value: 4, label: four },
  { value: 5, label: five },
];

export const coachMentalQuestions: CoachMentalQuestion[] = [
  // ----- coachingPresence (3) -----
  {
    id: "cp1",
    category: "coachingPresence",
    text: {
      en: "During a long training session, how present and attentive are you with each athlete?",
      da: "Under en lang træning — hvor nærværende og opmærksom er du på hver enkelt atlet?",
      sv: "Under ett långt pass — hur närvarande och uppmärksam är du på varje atlet?",
      de: "Wie präsent und aufmerksam bist du in einer langen Einheit bei jedem Athleten?",
      ar: "خلال جلسة تدريب طويلة، كم أنت حاضر ومنتبه لكل لاعب؟",
      no: "Under en lang økt — hvor til stede og oppmerksom er du på hver utøver?",
    },
    options: opts(
      { en: "I often drift — phone, thoughts, other tasks", da: "Jeg driver ofte væk — telefon, tanker, andre opgaver", sv: "Jag driver iväg ofta — telefon, tankar, annat", de: "Ich schweife oft ab — Handy, Gedanken, anderes", ar: "أشرد كثيرًا — الهاتف، الأفكار، مهام أخرى", no: "Jeg sklir ofte ut — telefon, tanker, annet" },
      { en: "I notice the loud athletes only", da: "Jeg lægger kun mærke til de mest synlige", sv: "Jag märker bara de mest högljudda", de: "Ich bemerke nur die lautesten Athleten", ar: "ألاحظ فقط الأكثر صوتًا", no: "Jeg ser bare de mest synlige" },
      { en: "Mostly present, occasionally distracted", da: "For det meste nærværende, lejlighedsvis distraheret", sv: "Mest närvarande, ibland distraherad", de: "Meist präsent, gelegentlich abgelenkt", ar: "حاضر في الغالب، مشتت أحيانًا", no: "For det meste til stede, av og til distrahert" },
      { en: "Fully focused on what's in front of me", da: "Fuldt fokuseret på det, der er foran mig", sv: "Helt fokuserad på det framför mig", de: "Voll fokussiert auf das, was vor mir ist", ar: "مركز تمامًا على ما أمامي", no: "Helt fokusert på det som er foran meg" },
      { en: "Deep flow — I read the room and adjust in real time", da: "Dyb flow — jeg læser rummet og justerer løbende", sv: "Djup flow — jag läser rummet och anpassar i realtid", de: "Tiefer Flow — ich lese den Raum und passe in Echtzeit an", ar: "تركيز عميق — أقرأ المجموعة وأعدّل لحظيًا", no: "Dyp flyt — jeg leser gruppa og justerer i sanntid" },
    ),
  },
  {
    id: "cp2",
    category: "coachingPresence",
    text: {
      en: "How well do you read athletes' body language and energy without them telling you?",
      da: "Hvor godt læser du atleternes kropssprog og energi uden at de siger noget?",
      sv: "Hur väl läser du atleters kroppsspråk och energi utan att de säger något?",
      de: "Wie gut liest du Körpersprache und Energie der Athleten ohne Worte?",
      ar: "كم تجيد قراءة لغة جسد اللاعبين وطاقتهم دون أن يتحدثوا؟",
      no: "Hvor godt leser du utøvernes kroppsspråk og energi uten ord?",
    },
    options: opts(
      { en: "Rarely — I only react when they speak up", da: "Sjældent — jeg reagerer kun, når de siger noget", sv: "Sällan — jag reagerar bara när de säger något", de: "Selten — ich reagiere nur, wenn sie etwas sagen", ar: "نادرًا — أرد فقط حين يتحدثون", no: "Sjelden — jeg reagerer kun når de sier noe" },
      { en: "I miss most subtle cues", da: "Jeg overser de fleste små signaler", sv: "Jag missar de flesta små signaler", de: "Ich übersehe die meisten feinen Signale", ar: "أفوّت معظم الإشارات الدقيقة", no: "Jeg overser de fleste små signaler" },
      { en: "I catch the obvious shifts", da: "Jeg fanger de tydelige skift", sv: "Jag märker tydliga förändringar", de: "Ich erkenne offensichtliche Veränderungen", ar: "ألتقط التغيرات الواضحة", no: "Jeg fanger tydelige endringer" },
      { en: "I usually sense fatigue, frustration or doubt early", da: "Jeg fornemmer som regel træthed, frustration eller tvivl tidligt", sv: "Jag känner oftast trötthet, frustration eller tvivel tidigt", de: "Ich spüre Müdigkeit, Frust oder Zweifel meist früh", ar: "أحس عادة بالتعب والإحباط والشك مبكرًا", no: "Jeg merker som regel slitenhet, frustrasjon eller tvil tidlig" },
      { en: "I read the room precisely and adapt the session", da: "Jeg læser rummet præcist og tilpasser træningen", sv: "Jag läser rummet exakt och anpassar passet", de: "Ich lese den Raum präzise und passe das Training an", ar: "أقرأ المجموعة بدقة وأكيّف الجلسة", no: "Jeg leser gruppa nøyaktig og tilpasser økta" },
    ),
  },
  {
    id: "cp3",
    category: "coachingPresence",
    text: {
      en: "How often do you check your phone or get pulled out of coaching during a session?",
      da: "Hvor ofte tjekker du telefonen eller bliver trukket ud af træningen under en session?",
      sv: "Hur ofta kollar du telefonen eller dras bort från coachingen under ett pass?",
      de: "Wie oft schaust du aufs Handy oder wirst während des Trainings rausgezogen?",
      ar: "كم مرة تتحقق من هاتفك أو تنشغل بعيدًا عن التدريب خلال الجلسة؟",
      no: "Hvor ofte sjekker du mobilen eller blir trukket ut av økta?",
    },
    options: opts(
      { en: "Constantly — it interrupts my flow", da: "Konstant — det afbryder mit flow", sv: "Hela tiden — det avbryter mitt flow", de: "Ständig — es unterbricht meinen Flow", ar: "باستمرار — يقطع تركيزي", no: "Hele tiden — det bryter flyten min" },
      { en: "Several times per session", da: "Flere gange pr. træning", sv: "Flera gånger per pass", de: "Mehrmals pro Einheit", ar: "عدة مرات في الجلسة", no: "Flere ganger per økt" },
      { en: "Once or twice", da: "En eller to gange", sv: "En eller två gånger", de: "Ein- bis zweimal", ar: "مرة أو مرتين", no: "En eller to ganger" },
      { en: "Only between blocks", da: "Kun mellem blokke", sv: "Bara mellan block", de: "Nur zwischen Blöcken", ar: "فقط بين الكتل التدريبية", no: "Kun mellom blokker" },
      { en: "Phone is away — I am fully on the floor", da: "Telefonen er væk — jeg er fuldt til stede", sv: "Telefonen är borta — jag är helt på golvet", de: "Handy weg — ich bin voll auf der Matte", ar: "الهاتف بعيد — أنا حاضر بالكامل", no: "Mobilen er vekk — jeg er helt på matta" },
    ),
  },

  // ----- emotionalRegulation (3) -----
  {
    id: "er1",
    category: "emotionalRegulation",
    text: {
      en: "When an athlete repeats the same mistake after coaching, you...",
      da: "Når en atlet gentager den samme fejl efter coaching, så...",
      sv: "När en atlet upprepar samma misstag efter coaching, så...",
      de: "Wenn ein Athlet den gleichen Fehler nach dem Coaching wiederholt, ...",
      ar: "عندما يكرر اللاعب الخطأ نفسه بعد التوجيه، أنت...",
      no: "Når en utøver gjentar samme feil etter coaching, så...",
    },
    options: opts(
      { en: "Get visibly frustrated and raise your voice", da: "Bliver tydeligt frustreret og hæver stemmen", sv: "Blir tydligt frustrerad och höjer rösten", de: "Werde sichtbar frustriert und werde laut", ar: "تشعر بالإحباط بوضوح وترفع صوتك", no: "Blir tydelig frustrert og hever stemmen" },
      { en: "Sigh and shorten your explanation", da: "Sukker og forkorter din forklaring", sv: "Suckar och kortar ner förklaringen", de: "Seufze und kürze die Erklärung", ar: "تتنهد وتختصر شرحك", no: "Sukker og kutter forklaringen kort" },
      { en: "Stay flat but lose patience inside", da: "Forbliver neutral men mister tålmodigheden indvendigt", sv: "Förblir neutral men tappar tålamodet inombords", de: "Bleibe äußerlich ruhig, verliere innen die Geduld", ar: "تبقى محايدًا لكنك تفقد الصبر داخليًا", no: "Beholder roen utad, men taper tålmodighet inni" },
      { en: "Reset your tone and try a new angle", da: "Nulstiller tonen og prøver en ny vinkel", sv: "Återställer tonen och provar en ny vinkel", de: "Setze deinen Ton zurück und versuche einen neuen Ansatz", ar: "تعيد ضبط نبرتك وتجرّب زاوية جديدة", no: "Nullstiller tonen og prøver en ny vinkel" },
      { en: "Stay curious — what is the real block here?", da: "Forbliver nysgerrig — hvad er den egentlige blokering?", sv: "Förblir nyfiken — vad är det egentliga hindret?", de: "Bleibe neugierig — was ist die echte Blockade?", ar: "تبقى فضوليًا — ما العائق الحقيقي؟", no: "Forblir nysgjerrig — hva er den egentlige sperra?" },
    ),
  },
  {
    id: "er2",
    category: "emotionalRegulation",
    text: {
      en: "A parent confronts you aggressively about playing time or selection. You...",
      da: "En forælder konfronterer dig aggressivt om kamptid eller udtagelse. Du...",
      sv: "En förälder konfronterar dig aggressivt om speltid eller uttagning. Du...",
      de: "Ein Elternteil konfrontiert dich aggressiv wegen Einsatzzeit oder Nominierung. Du...",
      ar: "يواجهك أحد الوالدين بعدوانية بشأن المشاركة أو الاختيار. أنت...",
      no: "En forelder konfronterer deg aggressivt om spilletid eller uttak. Du...",
    },
    options: opts(
      { en: "Match the heat and argue back", da: "Møder deres temperament og diskuterer", sv: "Möter deras hetta och argumenterar", de: "Steige auf gleicher Lautstärke ein und streite", ar: "ترد بنفس الحدة وتجادل", no: "Møter samme temperatur og krangler tilbake" },
      { en: "Get defensive and explain too much", da: "Bliver defensiv og forklarer for meget", sv: "Blir defensiv och förklarar för mycket", de: "Werde defensiv und erkläre zu viel", ar: "تتخذ موقفًا دفاعيًا وتشرح أكثر من اللازم", no: "Blir defensiv og forklarer altfor mye" },
      { en: "Stay polite but feel rattled afterwards", da: "Forbliver høflig, men ryster bagefter", sv: "Förblir artig, men skakar efteråt", de: "Bleibe höflich, bin danach aufgewühlt", ar: "تبقى مهذبًا لكنك تتأثر بعدها", no: "Forblir høflig, men sitter rystet etterpå" },
      { en: "Acknowledge, set a boundary, suggest a follow-up", da: "Anerkender, sætter en grænse, foreslår opfølgning", sv: "Bekräftar, sätter en gräns, föreslår uppföljning", de: "Erkenne an, setze eine Grenze, schlage Folgegespräch vor", ar: "تعترف، تضع حدًا، تقترح متابعة", no: "Anerkjenner, setter en grense, foreslår oppfølging" },
      { en: "Stay completely calm and re-route to the right channel", da: "Forbliver helt rolig og kanaliserer det rette sted hen", sv: "Förblir helt lugn och styr rätt", de: "Bleibe ganz ruhig und leite es richtig weiter", ar: "تبقى هادئًا تمامًا وتحوّله للقناة الصحيحة", no: "Forblir helt rolig og leder det rette sted" },
    ),
  },
  {
    id: "er3",
    category: "emotionalRegulation",
    text: {
      en: "After your team loses badly at a tournament, your tone in the next session is...",
      da: "Efter holdet taber stort til en stævne, er din tone i næste træning...",
      sv: "Efter att laget förlorat stort på en tävling är din ton nästa pass...",
      de: "Nach einer deutlichen Turnier-Niederlage ist dein Ton im nächsten Training...",
      ar: "بعد خسارة كبيرة لفريقك في بطولة، تكون نبرتك في الجلسة التالية...",
      no: "Etter at laget tapte stort i en turnering er tonen din i neste økt...",
    },
    options: opts(
      { en: "Cold and punishing", da: "Kold og straffende", sv: "Kall och bestraffande", de: "Kalt und bestrafend", ar: "باردة وعقابية", no: "Kald og straffende" },
      { en: "Short and irritated", da: "Kort og irriteret", sv: "Kort och irriterad", de: "Kurz und gereizt", ar: "قصيرة ومتوترة", no: "Kort og irritert" },
      { en: "Neutral but a bit distant", da: "Neutral men lidt distanceret", sv: "Neutral men lite avlägsen", de: "Neutral, aber etwas distanziert", ar: "محايدة لكنها بعيدة قليلًا", no: "Nøytral, men litt distansert" },
      { en: "Honest, calm, focused on the next step", da: "Ærlig, rolig, fokuseret på næste skridt", sv: "Ärlig, lugn, fokuserad på nästa steg", de: "Ehrlich, ruhig, auf den nächsten Schritt fokussiert", ar: "صادقة، هادئة، تركز على الخطوة التالية", no: "Ærlig, rolig, fokusert på neste steg" },
      { en: "Warm and steady — same standards, no blame", da: "Varm og stabil — samme krav, ingen skyld", sv: "Varm och stabil — samma krav, ingen skuld", de: "Warm und beständig — gleiche Standards, keine Schuldzuweisung", ar: "دافئة وثابتة — نفس المعايير دون لوم", no: "Varm og stabil — samme krav, ingen skyld" },
    ),
  },

  // ----- communicationFeedback (3) -----
  {
    id: "cf1",
    category: "communicationFeedback",
    text: {
      en: "When you correct an athlete, the balance between critique and encouragement is...",
      da: "Når du retter en atlet, er balancen mellem kritik og opmuntring...",
      sv: "När du rättar en atlet är balansen mellan kritik och uppmuntran...",
      de: "Wenn du Athleten korrigierst, ist die Balance zwischen Kritik und Ermutigung...",
      ar: "عندما تصحّح لاعبًا، يكون التوازن بين النقد والتشجيع...",
      no: "Når du retter en utøver, er balansen mellom kritikk og oppmuntring...",
    },
    options: opts(
      { en: "Almost all critique", da: "Næsten kun kritik", sv: "Nästan bara kritik", de: "Fast nur Kritik", ar: "نقد بالكامل تقريبًا", no: "Nesten bare kritikk" },
      { en: "Heavy on critique", da: "Mest kritik", sv: "Mest kritik", de: "Hauptsächlich Kritik", ar: "نقد في الغالب", no: "Mest kritikk" },
      { en: "Balanced but generic", da: "Balanceret men generisk", sv: "Balanserad men generell", de: "Ausgewogen, aber generisch", ar: "متوازن لكنه عام", no: "Balansert, men generisk" },
      { en: "Specific, direct, with a clear next step", da: "Specifik, direkte, med et tydeligt næste skridt", sv: "Specifik, direkt, med tydligt nästa steg", de: "Konkret, direkt, mit klarem nächsten Schritt", ar: "محدد، مباشر، مع خطوة تالية واضحة", no: "Spesifikk, direkte, med tydelig neste steg" },
      { en: "Tailored to that athlete — they leave more confident", da: "Skræddersyet til den enkelte — de går mere selvsikre", sv: "Skräddarsytt för atleten — de går självsäkrare", de: "Auf den Athleten zugeschnitten — sie gehen selbstsicherer raus", ar: "مصمم لذلك اللاعب — يخرج بثقة أكبر", no: "Skreddersydd til utøveren — de går mer selvsikre" },
    ),
  },
  {
    id: "cf2",
    category: "communicationFeedback",
    text: {
      en: "How well do you adapt your tone to age and level (kids vs. seniors)?",
      da: "Hvor godt tilpasser du din tone til alder og niveau (børn vs. seniorer)?",
      sv: "Hur väl anpassar du tonen till ålder och nivå (barn vs. seniorer)?",
      de: "Wie gut passt du deinen Ton an Alter und Level an (Kinder vs. Senioren)?",
      ar: "كم تجيد تكييف نبرتك مع العمر والمستوى (الأطفال مقابل الكبار)؟",
      no: "Hvor godt tilpasser du tonen til alder og nivå (barn vs. seniorer)?",
    },
    options: opts(
      { en: "Same tone for everyone", da: "Samme tone til alle", sv: "Samma ton för alla", de: "Gleicher Ton für alle", ar: "نفس النبرة للجميع", no: "Samme tone til alle" },
      { en: "Adjust loudness but not language", da: "Justerer lydstyrken men ikke sproget", sv: "Justerar volym men inte språk", de: "Passe Lautstärke an, aber nicht die Sprache", ar: "أضبط الصوت لا اللغة", no: "Justerer volum, ikke språk" },
      { en: "Some adaptation but not consistent", da: "Nogen tilpasning men ikke konsekvent", sv: "Viss anpassning men inte konsekvent", de: "Etwas Anpassung, aber nicht konsequent", ar: "بعض التكيّف لكن ليس باستمرار", no: "Noe tilpasning, men ikke konsekvent" },
      { en: "Different vocabulary and pace per group", da: "Forskelligt ordforråd og tempo pr. gruppe", sv: "Olika ordval och tempo per grupp", de: "Anderes Vokabular und Tempo pro Gruppe", ar: "مفردات وإيقاع مختلف لكل مجموعة", no: "Ulikt ordforråd og tempo per gruppe" },
      { en: "Fully tailored — I meet each athlete where they are", da: "Fuldt tilpasset — jeg møder hver atlet, hvor de er", sv: "Helt skräddarsytt — jag möter varje atlet där de är", de: "Voll abgestimmt — ich treffe jeden Athleten dort, wo er steht", ar: "مصممة بالكامل — أقابل كل لاعب حيث هو", no: "Helt skreddersydd — jeg møter hver utøver der de er" },
    ),
  },
  {
    id: "cf3",
    category: "communicationFeedback",
    text: {
      en: "How well do you listen — really listen — when an athlete is struggling?",
      da: "Hvor godt lytter du — virkelig lytter — når en atlet kæmper?",
      sv: "Hur väl lyssnar du — på riktigt — när en atlet kämpar?",
      de: "Wie gut hörst du wirklich zu, wenn ein Athlet kämpft?",
      ar: "كم تستمع حقًا عندما يعاني اللاعب؟",
      no: "Hvor godt lytter du — virkelig lytter — når en utøver sliter?",
    },
    options: opts(
      { en: "I jump in with answers fast", da: "Jeg kommer hurtigt med svar", sv: "Jag hoppar in med svar snabbt", de: "Ich springe schnell mit Antworten ein", ar: "أقفز بالإجابات بسرعة", no: "Jeg kommer raskt med svar" },
      { en: "I half-listen while planning the response", da: "Jeg lytter halvt, mens jeg planlægger svaret", sv: "Jag lyssnar halvt och planerar svaret", de: "Ich höre halb zu, während ich antworte plane", ar: "أستمع نصف الإصغاء بينما أخطط للرد", no: "Jeg halvlytter mens jeg planlegger svaret" },
      { en: "I listen, then quickly move on", da: "Jeg lytter, men går hurtigt videre", sv: "Jag lyssnar men går vidare snabbt", de: "Ich höre zu, gehe dann schnell weiter", ar: "أستمع ثم أمضي بسرعة", no: "Jeg lytter, men går raskt videre" },
      { en: "I ask follow-up questions before advising", da: "Jeg stiller opfølgende spørgsmål før jeg råder", sv: "Jag ställer följdfrågor innan jag ger råd", de: "Ich stelle Folgefragen, bevor ich rate", ar: "أطرح أسئلة متابعة قبل النصح", no: "Jeg stiller oppfølgingsspørsmål før jeg gir råd" },
      { en: "I make them feel heard, then we problem-solve together", da: "Jeg får dem til at føle sig hørt, så løser vi sammen", sv: "Jag får dem att känna sig hörda, sedan löser vi tillsammans", de: "Sie fühlen sich gehört, dann lösen wir gemeinsam", ar: "أُشعرهم بأنهم مسموعون ثم نحل معًا", no: "Jeg får dem til å føle seg hørt, så løser vi sammen" },
    ),
  },

  // ----- pressureExpectations (3) -----
  {
    id: "pe1",
    category: "pressureExpectations",
    text: {
      en: "Pressure from results (medals, rankings, club expectations) affects your mood...",
      da: "Pres fra resultater (medaljer, rankinger, klubbens forventninger) påvirker dit humør...",
      sv: "Press från resultat (medaljer, rankning, klubbens förväntningar) påverkar ditt humör...",
      de: "Ergebnisdruck (Medaillen, Ranglisten, Vereinserwartungen) beeinflusst deine Stimmung...",
      ar: "ضغط النتائج (الميداليات، التصنيف، توقعات النادي) يؤثر على مزاجك...",
      no: "Press fra resultater (medaljer, rangering, klubbens forventninger) påvirker humøret ditt...",
    },
    options: opts(
      { en: "Heavily — it follows me home daily", da: "Tungt — det følger mig hjem hver dag", sv: "Mycket — det följer mig hem dagligen", de: "Stark — es verfolgt mich täglich nach Hause", ar: "بشدة — يلاحقني للبيت يوميًا", no: "Tungt — det følger meg hjem hver dag" },
      { en: "Often — bad results ruin my week", da: "Ofte — dårlige resultater ødelægger min uge", sv: "Ofta — dåliga resultat förstör veckan", de: "Oft — schlechte Ergebnisse ruinieren meine Woche", ar: "غالبًا — النتائج السيئة تفسد أسبوعي", no: "Ofte — dårlige resultater ødelegger uka" },
      { en: "Sometimes — depends on the stakes", da: "Nogle gange — afhænger af indsatsen", sv: "Ibland — beror på vad som står på spel", de: "Manchmal — je nach Einsatz", ar: "أحيانًا — حسب الأهمية", no: "Iblant — kommer an på hva som står på spill" },
      { en: "Rarely — I separate self-worth from results", da: "Sjældent — jeg adskiller selvværd fra resultater", sv: "Sällan — jag skiljer självvärde från resultat", de: "Selten — ich trenne Selbstwert von Ergebnissen", ar: "نادرًا — أفصل قيمتي عن النتائج", no: "Sjelden — jeg skiller egenverd fra resultater" },
      { en: "Almost never — process over outcome", da: "Næsten aldrig — proces frem for resultat", sv: "Nästan aldrig — process före resultat", de: "Fast nie — Prozess vor Ergebnis", ar: "نادرًا جدًا — العملية قبل النتيجة", no: "Nesten aldri — prosess før resultat" },
    ),
  },
  {
    id: "pe2",
    category: "pressureExpectations",
    text: {
      en: "How well do you sleep the night before a big competition for your athletes?",
      da: "Hvor godt sover du natten før en stor konkurrence for dine atleter?",
      sv: "Hur väl sover du natten före en stor tävling för dina atleter?",
      de: "Wie gut schläfst du in der Nacht vor einem großen Wettkampf deiner Athleten?",
      ar: "كم تنام جيدًا في الليلة التي تسبق منافسة كبيرة للاعبيك؟",
      no: "Hvor godt sover du natten før en stor konkurranse for utøverne dine?",
    },
    options: opts(
      { en: "Barely — I lie awake replaying scenarios", da: "Næsten ikke — jeg ligger og spiller scenarier af", sv: "Knappt — jag ligger vaken och spelar upp scenarier", de: "Kaum — ich liege wach und spiele Szenarien durch", ar: "بالكاد — أبقى مستيقظًا أعيد السيناريوهات", no: "Knapt — jeg ligger våken og spiller av scenarier" },
      { en: "Restless, wake up several times", da: "Urolig, vågner flere gange", sv: "Orolig, vaknar flera gånger", de: "Unruhig, wache mehrmals auf", ar: "متقطع، أستيقظ عدة مرات", no: "Urolig, våkner flere ganger" },
      { en: "OK, a bit tense", da: "OK, lidt anspændt", sv: "Okej, lite spänd", de: "Okay, etwas angespannt", ar: "مقبول، متوتر قليلًا", no: "OK, litt anspent" },
      { en: "Solid — usual quality", da: "Solid — sædvanlig kvalitet", sv: "Bra — vanlig kvalitet", de: "Solide — wie sonst", ar: "جيد — كالعادة", no: "Solid — vanlig kvalitet" },
      { en: "Deep and easy — I trust the preparation", da: "Dyb og let — jeg stoler på forberedelsen", sv: "Djupt och enkelt — jag litar på förberedelsen", de: "Tief und leicht — ich vertraue der Vorbereitung", ar: "نوم عميق — أثق بالاستعداد", no: "Dyp og lett — jeg stoler på forberedelsen" },
    ),
  },
  {
    id: "pe3",
    category: "pressureExpectations",
    text: {
      en: "How clear are the boundaries between coaching time and personal life?",
      da: "Hvor klare er grænserne mellem coaching og privatliv?",
      sv: "Hur tydliga är gränserna mellan coaching och privatliv?",
      de: "Wie klar sind die Grenzen zwischen Coaching und Privatleben?",
      ar: "كم هي واضحة الحدود بين وقت التدريب والحياة الشخصية؟",
      no: "Hvor tydelige er grensene mellom coaching og privatliv?",
    },
    options: opts(
      { en: "There are no boundaries — I'm always on", da: "Der er ingen grænser — jeg er altid på", sv: "Inga gränser — jag är alltid på", de: "Keine Grenzen — ich bin immer auf Empfang", ar: "لا حدود — أنا دائمًا في الخدمة", no: "Ingen grenser — jeg er alltid på" },
      { en: "Mostly blurred — messages all evening", da: "Meget udvisket — beskeder hele aftenen", sv: "Mest suddiga — meddelanden hela kvällen", de: "Meist verschwommen — Nachrichten den ganzen Abend", ar: "غامضة في الغالب — رسائل طوال المساء", no: "Mest utvisket — meldinger hele kvelden" },
      { en: "Some boundaries, often crossed", da: "Nogle grænser, ofte overskredet", sv: "Vissa gränser, ofta överträdda", de: "Einige Grenzen, oft überschritten", ar: "بعض الحدود، تُختَرَق غالبًا", no: "Noen grenser, ofte brutt" },
      { en: "Clear hours, generally respected", da: "Klare tider, generelt respekteret", sv: "Tydliga tider, oftast respekterade", de: "Klare Zeiten, meist respektiert", ar: "أوقات واضحة، تُحترم عمومًا", no: "Klare tider, stort sett respektert" },
      { en: "Firm — coaching ends, my life begins", da: "Stærke — coaching slutter, mit liv begynder", sv: "Fasta — coaching slutar, mitt liv börjar", de: "Klar — Coaching endet, mein Leben beginnt", ar: "صارمة — ينتهي التدريب وتبدأ حياتي", no: "Faste — coaching slutter, livet mitt begynner" },
    ),
  },

  // ----- coachConfidence (3) -----
  {
    id: "cc1",
    category: "coachConfidence",
    text: {
      en: "How strong is your belief in your own coaching methods this month?",
      da: "Hvor stærk er troen på dine egne coachingmetoder denne måned?",
      sv: "Hur stark är tron på dina egna coachingmetoder denna månad?",
      de: "Wie stark ist dein Vertrauen in deine eigenen Coaching-Methoden diesen Monat?",
      ar: "كم هي قوية ثقتك بأساليبك التدريبية هذا الشهر؟",
      no: "Hvor sterk er troen på dine egne coachingmetoder denne måneden?",
    },
    options: opts(
      { en: "Shaken — I'm second-guessing everything", da: "Rystet — jeg betvivler alt", sv: "Skakad — jag ifrågasätter allt", de: "Erschüttert — ich zweifle an allem", ar: "مهتزة — أشكك بكل شيء", no: "Rystet — jeg tviler på alt" },
      { en: "Wobbly after recent results", da: "Vakler efter seneste resultater", sv: "Vacklande efter senaste resultaten", de: "Wackelig nach den letzten Ergebnissen", ar: "متذبذبة بعد النتائج الأخيرة", no: "Vaklende etter siste resultater" },
      { en: "Solid in the basics, unsure on the edges", da: "Solid i basis, usikker i kanterne", sv: "Stadig i grunden, osäker i kanterna", de: "Stabil im Kern, unsicher an den Rändern", ar: "ثابتة في الأساس، غير مؤكدة في الأطراف", no: "Solid i basis, usikker i kantene" },
      { en: "Confident — I know what works", da: "Selvsikker — jeg ved, hvad der virker", sv: "Säker — jag vet vad som funkar", de: "Selbstsicher — ich weiß, was funktioniert", ar: "واثق — أعرف ما يصلح", no: "Trygg — jeg vet hva som funker" },
      { en: "Rock-solid — I keep evolving with intention", da: "Klippefast — jeg udvikler mig bevidst", sv: "Stenhård — jag utvecklas medvetet", de: "Felsenfest — ich entwickle mich bewusst weiter", ar: "صلبة — أتطور بوعي", no: "Bunnsolid — jeg utvikler meg bevisst" },
    ),
  },
  {
    id: "cc2",
    category: "coachConfidence",
    text: {
      en: "When you see another coach get better results, you feel...",
      da: "Når du ser en anden træner få bedre resultater, føler du...",
      sv: "När du ser en annan tränare få bättre resultat, känner du...",
      de: "Wenn ein anderer Coach bessere Ergebnisse erzielt, fühlst du...",
      ar: "عندما ترى مدربًا آخر يحقق نتائج أفضل، تشعر...",
      no: "Når du ser en annen trener få bedre resultater, føler du...",
    },
    options: opts(
      { en: "Threatened and inadequate", da: "Truet og utilstrækkelig", sv: "Hotad och otillräcklig", de: "Bedroht und unzulänglich", ar: "تهديدًا وقصورًا", no: "Truet og utilstrekkelig" },
      { en: "Jealous, lose motivation", da: "Misundelig, mister motivation", sv: "Avundsjuk, tappar motivation", de: "Eifersüchtig, verliere Motivation", ar: "بالغيرة وفقدان الحافز", no: "Misunnelig, mister motivasjon" },
      { en: "Compare, then refocus", da: "Sammenligner, så fokuserer jeg igen", sv: "Jämför, sen fokuserar jag om", de: "Vergleiche, dann fokussiere ich neu", ar: "تقارن ثم تستعيد التركيز", no: "Sammenligner, så fokuserer på nytt" },
      { en: "Curious — what can I learn?", da: "Nysgerrig — hvad kan jeg lære?", sv: "Nyfiken — vad kan jag lära?", de: "Neugierig — was kann ich lernen?", ar: "بالفضول — ماذا أتعلم؟", no: "Nysgjerrig — hva kan jeg lære?" },
      { en: "Happy for them — secure in my own path", da: "Glad på deres vegne — tryg i min egen vej", sv: "Glad för dem — trygg i min egen väg", de: "Freue mich für sie — sicher in meinem Weg", ar: "بالسعادة لهم — مطمئن لمساري", no: "Glad på deres vegne — trygg i min egen vei" },
    ),
  },
  {
    id: "cc3",
    category: "coachConfidence",
    text: {
      en: "When an athlete questions your decision in front of others, you...",
      da: "Når en atlet betvivler din beslutning foran andre, så...",
      sv: "När en atlet ifrågasätter ditt beslut inför andra, så...",
      de: "Wenn ein Athlet deine Entscheidung vor anderen hinterfragt, ...",
      ar: "عندما يشكك لاعب في قرارك أمام الآخرين، أنت...",
      no: "Når en utøver setter spørsmålstegn ved beslutningen din foran andre, så...",
    },
    options: opts(
      { en: "Shut it down hard to protect authority", da: "Lukker det hårdt for at beskytte autoriteten", sv: "Stoppar det hårt för att skydda auktoriteten", de: "Stoppe es hart, um Autorität zu wahren", ar: "تسكته بحزم لحماية السلطة", no: "Stopper det hardt for å beskytte autoriteten" },
      { en: "Feel undermined and react sharply", da: "Føler dig undergravet og reagerer skarpt", sv: "Känner dig undergrävd och reagerar skarpt", de: "Fühle dich untergraben und reagiere scharf", ar: "تشعر بالاستنزاف وترد بحدة", no: "Føler deg undergravd og reagerer skarpt" },
      { en: "Defer the discussion, feel uneasy", da: "Udskyder diskussionen, føler dig urolig", sv: "Skjuter upp diskussionen, känner obehag", de: "Verschiebe die Diskussion, fühle mich unwohl", ar: "تؤجل النقاش وتشعر بالانزعاج", no: "Utsetter diskusjonen, føler ubehag" },
      { en: "Acknowledge the question, hold the line", da: "Anerkender spørgsmålet, holder linjen", sv: "Bekräftar frågan, håller linjen", de: "Erkenne die Frage an, halte die Linie", ar: "تعترف بالسؤال وتحافظ على موقفك", no: "Anerkjenner spørsmålet, holder linja" },
      { en: "Welcome it — confident leaders allow challenge", da: "Byder det velkomment — trygge ledere tillader udfordring", sv: "Välkomnar det — trygga ledare tillåter utmaning", de: "Heiße es willkommen — sichere Leader erlauben Widerspruch", ar: "ترحب به — القادة الواثقون يسمحون بالتحدي", no: "Ønsker det velkommen — trygge ledere tåler motstand" },
    ),
  },

  // ----- coachMotivation (3) -----
  {
    id: "cm1",
    category: "coachMotivation",
    text: {
      en: "On your way to training tonight, your energy is...",
      da: "På vej til træning i aften er din energi...",
      sv: "På väg till träningen i kväll är din energi...",
      de: "Auf dem Weg zum Training heute Abend ist deine Energie...",
      ar: "في طريقك إلى التدريب الليلة، طاقتك...",
      no: "På vei til økta i kveld er energien din...",
    },
    options: opts(
      { en: "Empty — I'm dragging myself there", da: "Tom — jeg slæber mig derhen", sv: "Tom — jag släpar mig dit", de: "Leer — ich schleppe mich hin", ar: "فارغة — أجرّ نفسي إلى هناك", no: "Tom — jeg sleper meg dit" },
      { en: "Low, hoping someone cancels", da: "Lav, håber nogen aflyser", sv: "Låg, hoppas någon ställer in", de: "Niedrig, hoffe jemand sagt ab", ar: "منخفضة، آمل أن يلغي أحدهم", no: "Lav, håper noen avlyser" },
      { en: "Average — doing my job", da: "Gennemsnitlig — jeg gør mit job", sv: "Genomsnittlig — jag gör jobbet", de: "Durchschnittlich — ich mache meinen Job", ar: "متوسطة — أؤدي عملي", no: "Gjennomsnittlig — jeg gjør jobben" },
      { en: "Good — ready to coach", da: "God — klar til at coache", sv: "Bra — redo att coacha", de: "Gut — bereit zu coachen", ar: "جيدة — مستعد للتدريب", no: "God — klar til å coache" },
      { en: "Excited — this is what I love", da: "Begejstret — det er det, jeg elsker", sv: "Entusiastisk — det är det jag älskar", de: "Begeistert — das liebe ich", ar: "متحمس — هذا ما أحبه", no: "Entusiastisk — dette er det jeg elsker" },
    ),
  },
  {
    id: "cm2",
    category: "coachMotivation",
    text: {
      en: "Over the past month, signs of burnout (irritability, cynicism, exhaustion) are...",
      da: "I sidste måned har tegn på udbrændthed (irritabilitet, kynisme, udmattelse) været...",
      sv: "Den senaste månaden har tecken på utbrändhet (irritation, cynism, utmattning) varit...",
      de: "Im letzten Monat waren Burnout-Zeichen (Reizbarkeit, Zynismus, Erschöpfung)...",
      ar: "خلال الشهر الماضي، علامات الإنهاك (تهيج، تشاؤم، إرهاق) كانت...",
      no: "Den siste måneden har tegn på utbrenthet (irritasjon, kynisme, utmattelse) vært...",
    },
    options: opts(
      { en: "Daily and obvious", da: "Daglige og tydelige", sv: "Dagliga och tydliga", de: "Täglich und offensichtlich", ar: "يومية وواضحة", no: "Daglige og tydelige" },
      { en: "Frequent, hard to ignore", da: "Hyppige, svære at ignorere", sv: "Frekventa, svåra att ignorera", de: "Häufig, schwer zu ignorieren", ar: "متكررة، يصعب تجاهلها", no: "Hyppige, vanskelige å overse" },
      { en: "Some weeks, not others", da: "Nogle uger, ikke andre", sv: "Vissa veckor, inte andra", de: "Manche Wochen, andere nicht", ar: "بعض الأسابيع لا غير", no: "Noen uker, ikke andre" },
      { en: "Rare and short", da: "Sjældne og korte", sv: "Sällsynta och korta", de: "Selten und kurz", ar: "نادرة وقصيرة", no: "Sjeldne og korte" },
      { en: "I feel energised and engaged", da: "Jeg føler mig energisk og engageret", sv: "Jag känner mig energisk och engagerad", de: "Ich fühle mich energiegeladen und engagiert", ar: "أشعر بالنشاط والانخراط", no: "Jeg føler meg energisk og engasjert" },
    ),
  },
  {
    id: "cm3",
    category: "coachMotivation",
    text: {
      en: "How often do you make space to reflect on yourself as a coach (journal, walk, talk)?",
      da: "Hvor ofte giver du dig tid til at reflektere over dig selv som træner (skrive, gå, snakke)?",
      sv: "Hur ofta tar du tid att reflektera över dig själv som tränare (skriva, gå, prata)?",
      de: "Wie oft nimmst du dir Zeit, über dich als Coach zu reflektieren (Journal, Spaziergang, Gespräch)?",
      ar: "كم مرة تخصص وقتًا للتأمل في نفسك كمدرب (كتابة، مشي، حوار)؟",
      no: "Hvor ofte gir du deg tid til å reflektere over deg selv som trener (skrive, gå, snakke)?",
    },
    options: opts(
      { en: "Never — no time", da: "Aldrig — ingen tid", sv: "Aldrig — ingen tid", de: "Nie — keine Zeit", ar: "أبدًا — لا وقت", no: "Aldri — ingen tid" },
      { en: "Maybe once a season", da: "Måske en gang pr. sæson", sv: "Kanske en gång per säsong", de: "Vielleicht einmal pro Saison", ar: "ربما مرة في الموسم", no: "Kanskje en gang per sesong" },
      { en: "After tournaments only", da: "Kun efter stævner", sv: "Bara efter tävlingar", de: "Nur nach Turnieren", ar: "فقط بعد البطولات", no: "Bare etter turneringer" },
      { en: "Roughly every couple of weeks", da: "Cirka hver anden uge", sv: "Ungefär varannan vecka", de: "Etwa alle zwei Wochen", ar: "تقريبًا كل أسبوعين", no: "Omtrent annenhver uke" },
      { en: "Weekly — it's part of my craft", da: "Ugentligt — det er en del af mit håndværk", sv: "Veckovis — det är en del av mitt hantverk", de: "Wöchentlich — Teil meines Handwerks", ar: "أسبوعيًا — جزء من حرفتي", no: "Ukentlig — det er en del av håndverket mitt" },
    ),
  },
];

export const coachCategoryOrder = [
  "coachingPresence",
  "emotionalRegulation",
  "communicationFeedback",
  "pressureExpectations",
  "coachConfidence",
  "coachMotivation",
] as const;
