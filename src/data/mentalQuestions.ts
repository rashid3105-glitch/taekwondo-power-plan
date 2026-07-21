export interface LangText {
  en: string;
  da: string;
  sv: string;
  de: string;
  ar: string;
}

export interface MentalQuestion {
  id: string;
  category: string;
  text: LangText;
  variants?: LangText[];
  options: { value: number; label: LangText }[];
}

/** Adult questions (age 15+) */
export const adultQuestions: MentalQuestion[] = [
  // Mental Toughness
  {
    id: "mt1",
    category: "mentalToughness",
    text: {
      en: "When training gets extremely hard, I...",
      da: "Når træningen bliver ekstremt hård, så...",
      sv: "När träningen blir extremt hård, så...",
      de: "Wenn das Training extrem hart wird, dann...",
      ar: "عندما يصبح التدريب صعبًا للغاية، أنا..."
    },
    variants: [
      { en: "Rate how you handle yourself when training gets brutal...", da: "Hvad sker der indeni, når træningen er på grænsen?", sv: "Vad händer inuti dig när träningen är på gränsen?", de: "Was passiert in dir wenn das Training an die Grenze geht?", ar: "كيف تتعامل مع نفسك عندما يكون التدريب على حافة القدرة؟" },
      { en: "Your coach pushes you past your comfort zone. You...", da: "Træneren presser dig ud over din komfortzone. Du...", sv: "Tränaren pressar dig utanför din komfortzon. Du...", de: "Dein Trainer drückt dich über deine Komfortzone. Du...", ar: "مدربك يدفعك خارج منطقة الراحة. أنت..." },
    ],
    options: [
      { value: 1, label: { en: "Usually quit or give up", da: "Giver jeg normalt op", sv: "Ger jag oftast upp", de: "Gebe ich normalerweise auf", ar: "عادة أستسلم" } },
      { value: 2, label: { en: "Struggle and often stop early", da: "Kæmper og stopper ofte tidligt", sv: "Kämpar och slutar ofta tidigt", de: "Kämpfe und höre oft früh auf", ar: "أعاني وغالبًا أتوقف مبكرًا" } },
      { value: 3, label: { en: "Push through most of the time", da: "Presser mig igennem det meste af tiden", sv: "Pressar mig igenom det mesta av tiden", de: "Kämpfe mich meistens durch", ar: "أتحمل في معظم الأوقات" } },
      { value: 4, label: { en: "Almost always push through", da: "Presser mig næsten altid igennem", sv: "Pressar mig nästan alltid igenom", de: "Kämpfe mich fast immer durch", ar: "أتحمل دائمًا تقريبًا" } },
      { value: 5, label: { en: "Thrive under pressure — I love the challenge", da: "Trives under pres — jeg elsker udfordringen", sv: "Trivs under press — jag älskar utmaningen", de: "Blühe unter Druck auf — ich liebe die Herausforderung", ar: "أزدهر تحت الضغط — أحب التحدي" } },
    ],
  },
  {
    id: "mt2",
    category: "mentalToughness",
    text: {
      en: "When I'm behind on points in a match, I...",
      da: "Når jeg er bagud på point i en kamp, så...",
      sv: "När jag ligger efter i poäng i en match, så...",
      de: "Wenn ich in einem Kampf mit Punkten hinten liege, dann...",
      ar: "عندما أكون متأخرًا بالنقاط في مباراة، أنا..."
    },
    variants: [
      { en: "You're 3 points down with 1 minute left. What happens in your head?", da: "Du er 3 point bagud med 1 minut tilbage. Hvad sker der i dit hoved?", sv: "Du är 3 poäng under med 1 minut kvar. Vad händer i ditt huvud?", de: "Du liegst 3 Punkte zurück mit 1 Minute noch. Was passiert in deinem Kopf?", ar: "أنت متأخر 3 نقاط ودقيقة واحدة متبقية. ماذا يحدث في رأسك؟" },
      { en: "Halfway through a match and things aren't going your way...", da: "Halvvejs i en kamp og tingene går ikke din vej...", sv: "Halvvägs i en match och saker går inte din väg...", de: "Auf halbem Weg durch einen Kampf und die Dinge laufen nicht nach Plan...", ar: "في منتصف المباراة والأمور لا تسير كما تريد..." },
    ],
    options: [
      { value: 1, label: { en: "Panic and lose composure completely", da: "Går i panik og mister fatningen helt", sv: "Får panik och tappar fattningen helt", de: "Gerate in Panik und verliere völlig die Fassung", ar: "أصاب بالذعر وأفقد رباطة جأشي تمامًا" } },
      { value: 2, label: { en: "Get frustrated and make more mistakes", da: "Bliver frustreret og laver flere fejl", sv: "Blir frustrerad och gör fler misstag", de: "Werde frustriert und mache mehr Fehler", ar: "أشعر بالإحباط وأرتكب المزيد من الأخطاء" } },
      { value: 3, label: { en: "Stay calm but struggle to change tactics", da: "Forbliver rolig, men kæmper med at ændre taktik", sv: "Förblir lugn men har svårt att ändra taktik", de: "Bleibe ruhig, aber habe Schwierigkeiten die Taktik zu ändern", ar: "أبقى هادئًا لكنني أجد صعوبة في تغيير التكتيكات" } },
      { value: 4, label: { en: "Stay composed and adjust my strategy", da: "Bevarer fatningen og justerer min strategi", sv: "Behåller lugnet och justerar min strategi", de: "Bleibe gelassen und passe meine Strategie an", ar: "أحافظ على هدوئي وأعدّل استراتيجيتي" } },
      { value: 5, label: { en: "Get more determined — being behind fuels me", da: "Bliver mere beslutsom — at være bagud driver mig", sv: "Blir mer beslutsam — att ligga efter driver mig", de: "Werde entschlossener — Rückstand motiviert mich", ar: "أصبح أكثر إصرارًا — التأخر يحفزني" } },
    ],
  },
  {
    id: "mt3",
    category: "mentalToughness",
    text: {
      en: "When I experience pain or discomfort during training, I...",
      da: "Når jeg oplever smerte eller ubehag under træning, så...",
      sv: "När jag upplever smärta eller obehag under träning, så...",
      de: "Wenn ich während des Trainings Schmerzen oder Unbehagen verspüre, dann...",
      ar: "عندما أشعر بالألم أو عدم الراحة أثناء التدريب، أنا..."
    },
    variants: [
      { en: "Your body is screaming at you mid-session. Your response is...", da: "Din krop skriger til dig midt i træningen. Din reaktion er...", sv: "Din kropp skriker mitt under passet. Din reaktion är...", de: "Dein Körper schreit dich mitten im Training an. Deine Reaktion ist...", ar: "جسمك يصرخ في منتصف التمرين. ردة فعلك هي..." },
      { en: "Discomfort hits during a hard set. What's your move?", da: "Ubehag rammer under et hårdt sæt. Hvad gør du?", sv: "Obehag slår till under ett tungt set. Vad gör du?", de: "Beschwerden treten bei einem harten Satz auf. Was tust du?", ar: "يأتيك الانزعاج أثناء مجموعة صعبة. ماذا تفعل؟" },
    ],
    options: [
      { value: 1, label: { en: "Stop immediately and avoid the exercise", da: "Stopper med det samme og undgår øvelsen", sv: "Slutar omedelbart och undviker övningen", de: "Höre sofort auf und meide die Übung", ar: "أتوقف فورًا وأتجنب التمرين" } },
      { value: 2, label: { en: "Reduce intensity significantly and feel defeated", da: "Reducerer intensiteten markant og føler mig besejret", sv: "Minskar intensiteten markant och känner mig besegrad", de: "Reduziere die Intensität deutlich und fühle mich besiegt", ar: "أقلل الشدة بشكل كبير وأشعر بالهزيمة" } },
      { value: 3, label: { en: "Modify and continue but feel distracted by it", da: "Tilpasser og fortsætter, men er distraheret af det", sv: "Anpassar och fortsätter men blir distraherad", de: "Passe an und mache weiter, bin aber abgelenkt", ar: "أعدّل وأستمر لكنني أشعر بالتشتت" } },
      { value: 4, label: { en: "Assess if it's safe, then push through with control", da: "Vurderer om det er sikkert, og presser derefter igennem med kontrol", sv: "Bedömer om det är säkert, sedan pressar jag igenom med kontroll", de: "Beurteile ob es sicher ist, dann kämpfe ich kontrolliert durch", ar: "أقيّم إذا كان آمنًا، ثم أتحمل بتحكم" } },
      { value: 5, label: { en: "Embrace it — I know pain is part of growth", da: "Omfavner det — jeg ved smerte er en del af vækst", sv: "Omfamnar det — jag vet att smärta är en del av utveckling", de: "Nehme es an — ich weiß, Schmerz gehört zum Wachstum", ar: "أتقبله — أعلم أن الألم جزء من النمو" } },
    ],
  },
  // Competition Anxiety
  {
    id: "ca1",
    category: "competitionAnxiety",
    text: {
      en: "Before a competition or sparring match, I feel...",
      da: "Før en konkurrence eller sparringkamp føler jeg mig...",
      sv: "Före en tävling eller sparringmatch känner jag mig...",
      de: "Vor einem Wettkampf oder Sparringkampf fühle ich mich...",
      ar: "قبل منافسة أو مباراة تدريبية، أشعر..."
    },
    variants: [
      { en: "You wake up on competition day. Your mind is...", da: "Du vågner på stævnedagen. Dit sind er...", sv: "Du vaknar på tävlingsdagen. Ditt sinne är...", de: "Du wachst am Wettkampftag auf. Dein Kopf ist...", ar: "تستيقظ في يوم المنافسة. ذهنك..." },
      { en: "An hour before you compete, your body and mind feel...", da: "En time før du konkurrerer, føler din krop og dit sind sig...", sv: "En timme innan du tävlar, känns din kropp och ditt sinne...", de: "Eine Stunde vor dem Wettkampf fühlen sich Körper und Geist...", ar: "قبل ساعة من منافستك، جسمك وعقلك يشعران..." },
    ],
    options: [
      { value: 1, label: { en: "Overwhelmed with anxiety, can't function well", da: "Overvældet af angst, kan ikke fungere godt", sv: "Överväldigad av ångest, kan inte fungera bra", de: "Überwältigt von Angst, kann nicht gut funktionieren", ar: "غارق في القلق، لا أستطيع العمل بشكل جيد" } },
      { value: 2, label: { en: "Very nervous, it hurts my performance", da: "Meget nervøs, det påvirker min præstation negativt", sv: "Väldigt nervös, det skadar min prestation", de: "Sehr nervös, es schadet meiner Leistung", ar: "متوتر جدًا، يؤثر على أدائي" } },
      { value: 3, label: { en: "Some nerves but I manage them ok", da: "Lidt nerver, men jeg håndterer dem ok", sv: "Lite nervös men jag hanterar det okej", de: "Etwas nervös, aber ich komme damit klar", ar: "بعض التوتر لكنني أتعامل معه بشكل جيد" } },
      { value: 4, label: { en: "Good nerves that help me focus", da: "Gode nerver der hjælper mig med at fokusere", sv: "Bra nerver som hjälper mig fokusera", de: "Gute Nervosität die mir hilft zu fokussieren", ar: "توتر إيجابي يساعدني على التركيز" } },
      { value: 5, label: { en: "Calm and excited — I channel energy positively", da: "Rolig og begejstret — jeg kanaliserer energien positivt", sv: "Lugn och exalterad — jag kanaliserar energin positivt", de: "Ruhig und aufgeregt — ich kanalisiere die Energie positiv", ar: "هادئ ومتحمس — أوجه طاقتي بإيجابية" } },
    ],
  },
  {
    id: "ca2",
    category: "competitionAnxiety",
    text: {
      en: "My body's physical response to competition stress is...",
      da: "Min krops fysiske reaktion på konkurrencestress er...",
      sv: "Min kropps fysiska reaktion på tävlingsstress är...",
      de: "Die körperliche Reaktion meines Körpers auf Wettkampfstress ist...",
      ar: "استجابة جسدي الجسدية لضغط المنافسة هي..."
    },
    variants: [
      { en: "When competition stress hits, your body reacts by...", da: "Når konkurrencestress rammer, reagerer din krop med...", sv: "När tävlingsstress slår till reagerar kroppen med...", de: "Wenn Wettkampfstress kommt, reagiert dein Körper mit...", ar: "عندما يضربك ضغط المنافسة، جسمك يتفاعل بـ..." },
      { en: "Pre-fight nerves show up in your body as...", da: "Nerver før kamp viser sig i kroppen som...", sv: "Nerverna före kampen visar sig i kroppen som...", de: "Wettkampfnervosität zeigt sich körperlich als...", ar: "التوتر قبل القتال يظهر في جسمك كـ..." },
    ],
    options: [
      { value: 1, label: { en: "Severe — shaking, nausea, can't warm up properly", da: "Alvorlig — rysten, kvalme, kan ikke varme ordentligt op", sv: "Allvarlig — skakningar, illamående, kan inte värma upp ordentligt", de: "Schwer — Zittern, Übelkeit, kann mich nicht richtig aufwärmen", ar: "شديدة — ارتعاش، غثيان، لا أستطيع الإحماء بشكل صحيح" } },
      { value: 2, label: { en: "Noticeable tension, tight muscles, shallow breathing", da: "Mærkbar spænding, stramme muskler, overfladisk vejrtrækning", sv: "Märkbar spänning, stela muskler, ytlig andning", de: "Spürbare Anspannung, verspannte Muskeln, flache Atmung", ar: "توتر ملحوظ، عضلات مشدودة، تنفس ضحل" } },
      { value: 3, label: { en: "Some butterflies but I can still perform", da: "Lidt sommerfugle, men jeg kan stadig præstere", sv: "Lite fjärilar men jag kan fortfarande prestera", de: "Ein paar Schmetterlinge, aber ich kann trotzdem performen", ar: "بعض القلق لكنني أستطيع الأداء" } },
      { value: 4, label: { en: "Controlled adrenaline, I use breathing techniques", da: "Kontrolleret adrenalin, jeg bruger vejrtræningsteknikker", sv: "Kontrollerat adrenalin, jag använder andningstekniker", de: "Kontrolliertes Adrenalin, ich nutze Atemtechniken", ar: "أدرينالين مسيطر عليه، أستخدم تقنيات التنفس" } },
      { value: 5, label: { en: "I feel energized and physically ready to compete", da: "Jeg føler mig energisk og fysisk klar til at konkurrere", sv: "Jag känner mig energisk och fysiskt redo att tävla", de: "Ich fühle mich energiegeladen und körperlich bereit zum Wettkampf", ar: "أشعر بالنشاط والاستعداد البدني للمنافسة" } },
    ],
  },
  {
    id: "ca3",
    category: "competitionAnxiety",
    text: {
      en: "The night before a competition, my sleep is...",
      da: "Natten før en konkurrence er min søvn...",
      sv: "Natten före en tävling är min sömn...",
      de: "Die Nacht vor einem Wettkampf, mein Schlaf ist...",
      ar: "في الليلة السابقة للمنافسة، نومي..."
    },
    variants: [
      { en: "How well do you actually sleep the night before fight day?", da: "Hvor godt sover du faktisk natten før kampdag?", sv: "Hur väl sover du faktiskt natten före tävlingsdagen?", de: "Wie gut schläfst du wirklich in der Nacht vor dem Wettkampftag?", ar: "كم تنام جيدًا فعلاً في الليلة السابقة ليوم القتال؟" },
      { en: "Comp tomorrow. You're in bed. What happens?", da: "Stævne i morgen. Du ligger i sengen. Hvad sker der?", sv: "Tävling imorgon. Du ligger i sängen. Vad händer?", de: "Wettkampf morgen. Du liegst im Bett. Was passiert?", ar: "منافسة غدًا. أنت في السرير. ماذا يحدث؟" },
    ],
    options: [
      { value: 1, label: { en: "Terrible — I barely sleep, mind races all night", da: "Forfærdelig — jeg sover næsten ikke, tankerne kører hele natten", sv: "Hemsk — jag sover knappt, tankarna rusar hela natten", de: "Schrecklich — ich schlafe kaum, Gedanken rasen die ganze Nacht", ar: "فظيع — بالكاد أنام، أفكاري تتسارع طوال الليل" } },
      { value: 2, label: { en: "Restless, I wake up multiple times", da: "Urolig, jeg vågner flere gange", sv: "Rastlös, jag vaknar flera gånger", de: "Unruhig, ich wache mehrmals auf", ar: "مضطرب، أستيقظ عدة مرات" } },
      { value: 3, label: { en: "Okay but not great, some difficulty falling asleep", da: "Okay men ikke fantastisk, lidt svært at falde i søvn", sv: "Okej men inte bra, lite svårt att somna", de: "Okay aber nicht toll, etwas schwer einzuschlafen", ar: "مقبول لكن ليس رائعًا، بعض الصعوبة في النوم" } },
      { value: 4, label: { en: "Good — I have a routine that helps me relax", da: "God — jeg har en rutine der hjælper mig med at slappe af", sv: "Bra — jag har en rutin som hjälper mig slappna av", de: "Gut — ich habe eine Routine die mir hilft mich zu entspannen", ar: "جيد — لدي روتين يساعدني على الاسترخاء" } },
      { value: 5, label: { en: "Great — I sleep well knowing I'm prepared", da: "Fantastisk — jeg sover godt og ved jeg er forberedt", sv: "Utmärkt — jag sover gott och vet att jag är förberedd", de: "Großartig — ich schlafe gut, weil ich weiß dass ich vorbereitet bin", ar: "رائع — أنام جيدًا عالمًا أنني مستعد" } },
    ],
  },
  // Focus & Concentration
  {
    id: "fc1",
    category: "focusConcentration",
    text: {
      en: "During a match or intense training, my focus is...",
      da: "Under en kamp eller intens træning er mit fokus...",
      sv: "Under en match eller intensiv träning är mitt fokus...",
      de: "Während eines Kampfes oder intensiven Trainings ist mein Fokus...",
      ar: "خلال مباراة أو تدريب مكثف، تركيزي..."
    },
    options: [
      { value: 1, label: { en: "Easily distracted, mind wanders a lot", da: "Let at distrahere, tankerne vandrer meget", sv: "Lättdistraherad, tankarna vandrar mycket", de: "Leicht abgelenkt, Gedanken schweifen oft ab", ar: "أتشتت بسهولة، ذهني يشرد كثيرًا" } },
      { value: 2, label: { en: "Often lose focus at critical moments", da: "Mister ofte fokus på kritiske tidspunkter", sv: "Tappar ofta fokus vid kritiska ögonblick", de: "Verliere oft den Fokus in kritischen Momenten", ar: "غالبًا أفقد التركيز في اللحظات الحاسمة" } },
      { value: 3, label: { en: "Generally focused but sometimes drift", da: "Generelt fokuseret, men driver nogle gange", sv: "Generellt fokuserad men driver ibland iväg", de: "Generell fokussiert, schwanke aber manchmal", ar: "مركّز بشكل عام لكنني أشرد أحيانًا" } },
      { value: 4, label: { en: "Strong focus, rarely lose concentration", da: "Stærkt fokus, mister sjældent koncentrationen", sv: "Starkt fokus, tappar sällan koncentrationen", de: "Starker Fokus, verliere selten die Konzentration", ar: "تركيز قوي، نادرًا ما أفقد التركيز" } },
      { value: 5, label: { en: "Laser-focused, nothing breaks my concentration", da: "Laserfokuseret, intet bryder min koncentration", sv: "Laserfokuserad, inget bryter min koncentration", de: "Laserfokussiert, nichts bricht meine Konzentration", ar: "تركيز حاد، لا شيء يكسر تركيزي" } },
    ],
  },
  {
    id: "fc2",
    category: "focusConcentration",
    text: {
      en: "When the crowd is loud or my opponent trash-talks, I...",
      da: "Når publikum er højlydt eller min modstander provokerer, så...",
      sv: "När publiken är högljudd eller min motståndare provocerar, så...",
      de: "Wenn die Menge laut ist oder mein Gegner provoziert, dann...",
      ar: "عندما يكون الجمهور صاخبًا أو يستفزني خصمي، أنا..."
    },
    options: [
      { value: 1, label: { en: "Get completely thrown off my game", da: "Bliver fuldstændig distraheret fra min kamp", sv: "Tappar helt mitt spel", de: "Werde komplett aus dem Konzept gebracht", ar: "أفقد تركيزي تمامًا" } },
      { value: 2, label: { en: "It bothers me and affects my decisions", da: "Det generer mig og påvirker mine beslutninger", sv: "Det stör mig och påverkar mina beslut", de: "Es stört mich und beeinflusst meine Entscheidungen", ar: "يزعجني ويؤثر على قراراتي" } },
      { value: 3, label: { en: "Notice it but can refocus after a moment", da: "Bemærker det, men kan genfokusere efter et øjeblik", sv: "Noterar det men kan fokusera om efter en stund", de: "Bemerke es, kann mich aber nach einem Moment wieder fokussieren", ar: "ألاحظه لكنني أستعيد تركيزي بعد لحظة" } },
      { value: 4, label: { en: "Block it out and stay in my zone", da: "Blokerer det og forbliver i min zone", sv: "Blockerar det och stannar i min zon", de: "Blende es aus und bleibe in meiner Zone", ar: "أحجبه وأبقى في منطقتي" } },
      { value: 5, label: { en: "Use it as fuel — external noise sharpens me", da: "Bruger det som brændstof — ekstern støj skærper mig", sv: "Använder det som bränsle — externt ljud skärper mig", de: "Nutze es als Treibstoff — externer Lärm schärft mich", ar: "أستخدمه كوقود — الضوضاء الخارجية تشحذني" } },
    ],
  },
  {
    id: "fc3",
    category: "focusConcentration",
    text: {
      en: "Between rounds or during breaks, my mind...",
      da: "Mellem runder eller i pauser er mit sind...",
      sv: "Mellan ronder eller under pauser, mitt sinne...",
      de: "Zwischen Runden oder in Pausen, mein Geist...",
      ar: "بين الجولات أو خلال الاستراحات، ذهني..."
    },
    options: [
      { value: 1, label: { en: "Replays mistakes obsessively, I can't let go", da: "Genafspiller fejl tvangsmæssigt, jeg kan ikke slippe", sv: "Spelar om misstag tvångsmässigt, jag kan inte släppa", de: "Spielt Fehler zwanghaft ab, ich kann nicht loslassen", ar: "يعيد الأخطاء بشكل متكرر، لا أستطيع التخلي" } },
      { value: 2, label: { en: "Wanders to unrelated thoughts, hard to reset", da: "Vandrer til urelaterede tanker, svært at nulstille", sv: "Vandrar till orelaterade tankar, svårt att nollställa", de: "Schweift zu irrelevanten Gedanken ab, schwer zurückzusetzen", ar: "يشرد لأفكار غير متعلقة، صعب إعادة التركيز" } },
      { value: 3, label: { en: "Somewhat focused, but I lose my game plan", da: "Noget fokuseret, men mister min kampplan", sv: "Något fokuserat, men jag tappar min spelplan", de: "Etwas fokussiert, aber ich verliere meinen Spielplan", ar: "مركّز إلى حد ما، لكنني أفقد خطة اللعب" } },
      { value: 4, label: { en: "I use breaks to breathe, reset and refocus", da: "Jeg bruger pauser til at trække vejret, nulstille og genfokusere", sv: "Jag använder pauser för att andas, nollställa och fokusera om", de: "Ich nutze Pausen zum Atmen, Zurücksetzen und Neufokussieren", ar: "أستخدم الاستراحات للتنفس وإعادة التركيز" } },
      { value: 5, label: { en: "I have a clear mental routine for every break", da: "Jeg har en klar mental rutine for hver pause", sv: "Jag har en tydlig mental rutin för varje paus", de: "Ich habe eine klare mentale Routine für jede Pause", ar: "لدي روتين ذهني واضح لكل استراحة" } },
    ],
  },
  // Recovery from Loss
  {
    id: "rl1",
    category: "recoveryFromLoss",
    text: {
      en: "After losing a fight or performing poorly, I...",
      da: "Efter at have tabt en kamp eller præsteret dårligt...",
      sv: "Efter att ha förlorat en match eller presterat dåligt, så...",
      de: "Nach einer Niederlage oder schlechten Leistung, dann...",
      ar: "بعد خسارة مباراة أو أداء سيئ، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel devastated for days/weeks, lose motivation", da: "Føler mig knust i dage/uger, mister motivationen", sv: "Känner mig förkrossad i dagar/veckor, tappar motivationen", de: "Bin tagelang/wochenlang am Boden, verliere die Motivation", ar: "أشعر بالدمار لأيام/أسابيع، أفقد الحافز" } },
      { value: 2, label: { en: "It affects me a lot, hard to bounce back", da: "Det påvirker mig meget, svært at komme tilbage", sv: "Det påverkar mig mycket, svårt att studsa tillbaka", de: "Es betrifft mich sehr, schwer zurückzukommen", ar: "يؤثر علي كثيرًا، صعب التعافي" } },
      { value: 3, label: { en: "Disappointed but recover within a day or two", da: "Skuffet, men komme mig inden for en dag eller to", sv: "Besviken men återhämtar mig inom en dag eller två", de: "Enttäuscht, aber erhole mich innerhalb von ein bis zwei Tagen", ar: "محبط لكنني أتعافى خلال يوم أو يومين" } },
      { value: 4, label: { en: "Use it as fuel, analyze and move on quickly", da: "Bruger det som brændstof, analyserer og kommer videre hurtigt", sv: "Använder det som bränsle, analyserar och går vidare snabbt", de: "Nutze es als Antrieb, analysiere und mache schnell weiter", ar: "أستخدمه كوقود، أحلل وأمضي قدمًا بسرعة" } },
      { value: 5, label: { en: "See losses as the best learning opportunities", da: "Ser nederlag som de bedste læringsmuligheder", sv: "Ser förluster som de bästa lärtillfällena", de: "Sehe Niederlagen als die besten Lernmöglichkeiten", ar: "أرى الخسائر كأفضل فرص للتعلم" } },
    ],
  },
  {
    id: "rl2",
    category: "recoveryFromLoss",
    text: {
      en: "When I watch video of a match I lost, I...",
      da: "Når jeg ser video af en kamp, jeg tabte, så...",
      sv: "När jag tittar på video av en match jag förlorade, så...",
      de: "Wenn ich ein Video eines verlorenen Kampfes ansehe, dann...",
      ar: "عندما أشاهد فيديو مباراة خسرتها، أنا..."
    },
    options: [
      { value: 1, label: { en: "Avoid it completely — too painful to watch", da: "Undgår det fuldstændigt — for smertefuldt at se", sv: "Undviker det helt — för smärtsamt att titta", de: "Vermeide es komplett — zu schmerzhaft anzusehen", ar: "أتجنبه تمامًا — مؤلم جدًا للمشاهدة" } },
      { value: 2, label: { en: "Watch but get frustrated and emotional", da: "Ser det, men bliver frustreret og følelsesladet", sv: "Tittar men blir frustrerad och känslomässig", de: "Schaue es an, werde aber frustriert und emotional", ar: "أشاهد لكنني أشعر بالإحباط والعاطفة" } },
      { value: 3, label: { en: "Can watch it and notice some mistakes", da: "Kan se det og bemærke nogle fejl", sv: "Kan titta och notera några misstag", de: "Kann es ansehen und einige Fehler bemerken", ar: "أستطيع مشاهدته وملاحظة بعض الأخطاء" } },
      { value: 4, label: { en: "Analyze calmly and make notes for improvement", da: "Analyserer roligt og tager noter til forbedring", sv: "Analyserar lugnt och gör anteckningar för förbättring", de: "Analysiere ruhig und mache Notizen zur Verbesserung", ar: "أحلل بهدوء وأدوّن ملاحظات للتحسين" } },
      { value: 5, label: { en: "Love reviewing — I build a detailed improvement plan", da: "Elsker at gennemgå — jeg laver en detaljeret forbedringsplan", sv: "Älskar att granska — jag bygger en detaljerad förbättringsplan", de: "Liebe die Analyse — ich erstelle einen detaillierten Verbesserungsplan", ar: "أحب المراجعة — أضع خطة تحسين مفصلة" } },
    ],
  },
  {
    id: "rl3",
    category: "recoveryFromLoss",
    text: {
      en: "When a teammate beats me in training, I...",
      da: "Når en holdkammerat slår mig i træning, så...",
      sv: "När en lagkamrat slår mig i träning, så...",
      de: "Wenn ein Teamkollege mich im Training schlägt, dann...",
      ar: "عندما يهزمني زميل في الفريق في التدريب، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel embarrassed and avoid sparring them again", da: "Føler mig flov og undgår at spar med dem igen", sv: "Känner mig generad och undviker att sparras med dem igen", de: "Fühle mich peinlich berührt und vermeide es erneut mit ihnen zu sparren", ar: "أشعر بالإحراج وأتجنب التدريب معهم مرة أخرى" } },
      { value: 2, label: { en: "Get annoyed and it ruins the rest of my session", da: "Bliver irriteret og det ødelægger resten af min træning", sv: "Blir irriterad och det förstör resten av mitt pass", de: "Bin genervt und es ruiniert den Rest meiner Einheit", ar: "أنزعج ويفسد بقية تدريبي" } },
      { value: 3, label: { en: "Accept it but don't learn much from it", da: "Accepterer det, men lærer ikke meget af det", sv: "Accepterar det men lär mig inte mycket av det", de: "Akzeptiere es, lerne aber nicht viel daraus", ar: "أتقبله لكنني لا أتعلم الكثير منه" } },
      { value: 4, label: { en: "Ask them what they did and learn from it", da: "Spørger dem hvad de gjorde og lærer af det", sv: "Frågar dem vad de gjorde och lär mig av det", de: "Frage sie was sie gemacht haben und lerne daraus", ar: "أسألهم ماذا فعلوا وأتعلم منه" } },
      { value: 5, label: { en: "Welcome it — training with better athletes makes me grow", da: "Velkomner det — at træne med bedre atleter får mig til at vokse", sv: "Välkomnar det — att träna med bättre atleter får mig att växa", de: "Begrüße es — Training mit besseren Athleten lässt mich wachsen", ar: "أرحب به — التدريب مع رياضيين أفضل يجعلني أنمو" } },
    ],
  },
  // Confidence
  {
    id: "cf1",
    category: "confidence",
    text: {
      en: "My belief in my own abilities is...",
      da: "Min tro på mine egne evner er...",
      sv: "Min tro på mina egna förmågor är...",
      de: "Mein Glaube an meine eigenen Fähigkeiten ist...",
      ar: "إيماني بقدراتي الخاصة هو..."
    },
    options: [
      { value: 1, label: { en: "Very low — I doubt myself constantly", da: "Meget lav — jeg tvivler konstant på mig selv", sv: "Väldigt låg — jag tvivlar ständigt på mig själv", de: "Sehr niedrig — ich zweifle ständig an mir selbst", ar: "منخفض جدًا — أشك في نفسي باستمرار" } },
      { value: 2, label: { en: "Low — I often feel I'm not good enough", da: "Lav — jeg føler ofte, at jeg ikke er god nok", sv: "Låg — jag känner ofta att jag inte är tillräckligt bra", de: "Niedrig — ich fühle mich oft nicht gut genug", ar: "منخفض — أشعر غالبًا أنني لست جيدًا بما فيه الكفاية" } },
      { value: 3, label: { en: "Moderate — depends on the situation", da: "Moderat — afhænger af situationen", sv: "Måttlig — beror på situationen", de: "Mäßig — hängt von der Situation ab", ar: "معتدل — يعتمد على الموقف" } },
      { value: 4, label: { en: "High — I trust my training and skills", da: "Høj — jeg stoler på min træning og mine evner", sv: "Hög — jag litar på min träning och mina färdigheter", de: "Hoch — ich vertraue meinem Training und meinen Fähigkeiten", ar: "عالي — أثق بتدريبي ومهاراتي" } },
      { value: 5, label: { en: "Very high — I know I can compete with anyone", da: "Meget høj — jeg ved, at jeg kan konkurrere med alle", sv: "Väldigt hög — jag vet att jag kan tävla med vem som helst", de: "Sehr hoch — ich weiß, dass ich mit jedem konkurrieren kann", ar: "عالي جدًا — أعلم أنني أستطيع منافسة أي شخص" } },
    ],
  },
  {
    id: "cf2",
    category: "confidence",
    text: {
      en: "When facing a higher-ranked or bigger opponent, I...",
      da: "Når jeg møder en højere rangeret eller større modstander, så...",
      sv: "När jag möter en högre rankad eller större motståndare, så...",
      de: "Wenn ich einem höherrangigen oder größeren Gegner gegenüberstehe, dann...",
      ar: "عندما أواجه خصمًا أعلى تصنيفًا أو أكبر، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel defeated before the match even starts", da: "Føler mig besejret, før kampen overhovedet begynder", sv: "Känner mig besegrad innan matchen ens börjar", de: "Fühle mich besiegt, bevor der Kampf überhaupt beginnt", ar: "أشعر بالهزيمة قبل أن تبدأ المباراة" } },
      { value: 2, label: { en: "Feel intimidated and play it too safe", da: "Føler mig skræmt og spiller det for sikkert", sv: "Känner mig skrämd och spelar det för säkert", de: "Fühle mich eingeschüchtert und spiele zu sicher", ar: "أشعر بالخوف وألعب بحذر شديد" } },
      { value: 3, label: { en: "Respect them but still give my best effort", da: "Respekterer dem, men giver stadig mit bedste", sv: "Respekterar dem men ger fortfarande mitt bästa", de: "Respektiere sie, gebe aber trotzdem mein Bestes", ar: "أحترمهم لكنني أبذل قصارى جهدي" } },
      { value: 4, label: { en: "See it as a great test and rise to the occasion", da: "Ser det som en stor test og rejser mig til lejligheden", sv: "Ser det som ett bra test och stiger till tillfället", de: "Sehe es als große Herausforderung und wachse daran", ar: "أراه اختبارًا رائعًا وأرتقي للمناسبة" } },
      { value: 5, label: { en: "Love the challenge — I compete harder against top fighters", da: "Elsker udfordringen — jeg kæmper hårdere mod topkæmpere", sv: "Älskar utmaningen — jag tävlar hårdare mot toppkämpar", de: "Liebe die Herausforderung — ich kämpfe härter gegen Top-Kämpfer", ar: "أحب التحدي — أنافس بقوة أكبر ضد أفضل المقاتلين" } },
    ],
  },
  {
    id: "cf3",
    category: "confidence",
    text: {
      en: "When I learn a new technique, I...",
      da: "Når jeg lærer en ny teknik, så...",
      sv: "När jag lär mig en ny teknik, så...",
      de: "Wenn ich eine neue Technik lerne, dann...",
      ar: "عندما أتعلم تقنية جديدة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel overwhelmed and doubt I'll ever master it", da: "Føler mig overvældet og tvivler på at jeg nogensinde mestrer den", sv: "Känner mig överväldigad och tvivlar på att jag någonsin bemästrar den", de: "Fühle mich überfordert und zweifle ob ich sie jemals beherrsche", ar: "أشعر بالإرهاق وأشك في أنني سأتقنها" } },
      { value: 2, label: { en: "Try it a few times but give up quickly if it's hard", da: "Prøver det et par gange, men giver hurtigt op hvis det er svært", sv: "Provar det några gånger men ger upp snabbt om det är svårt", de: "Probiere es ein paar Mal, gebe aber schnell auf wenn es schwer ist", ar: "أجربها مرات قليلة لكنني أستسلم بسرعة إذا كانت صعبة" } },
      { value: 3, label: { en: "Practice it but feel unsure about using it in sparring", da: "Øver den, men føler mig usikker på at bruge den i sparring", sv: "Övar den men känner mig osäker på att använda den i sparring", de: "Übe sie, bin aber unsicher sie im Sparring zu nutzen", ar: "أتدرب عليها لكنني غير متأكد من استخدامها في التدريب" } },
      { value: 4, label: { en: "Commit to drilling it until it feels natural", da: "Forpligter mig til at drilbe den indtil den føles naturlig", sv: "Förbinder mig att drilla den tills den känns naturlig", de: "Verpflichte mich sie zu trainieren bis sie sich natürlich anfühlt", ar: "ألتزم بالتدريب عليها حتى تصبح طبيعية" } },
      { value: 5, label: { en: "Get excited — new techniques are opportunities to evolve", da: "Bliver begejstret — nye teknikker er muligheder for at udvikle mig", sv: "Blir exalterad — nya tekniker är möjligheter att utvecklas", de: "Bin begeistert — neue Techniken sind Chancen mich weiterzuentwickeln", ar: "أتحمس — التقنيات الجديدة فرص للتطور" } },
    ],
  },
  // Motivation
  {
    id: "mo1",
    category: "motivation",
    text: {
      en: "My motivation to train and compete is...",
      da: "Min motivation til at træne og konkurrere er...",
      sv: "Min motivation att träna och tävla är...",
      de: "Meine Motivation zu trainieren und zu wettkämpfen ist...",
      ar: "حافزي للتدريب والمنافسة هو..."
    },
    options: [
      { value: 1, label: { en: "Very low, I often skip training", da: "Meget lav, jeg springer ofte træning over", sv: "Väldigt låg, jag hoppar ofta över träning", de: "Sehr niedrig, ich lasse oft das Training ausfallen", ar: "منخفض جدًا، غالبًا أتغيب عن التدريب" } },
      { value: 2, label: { en: "Inconsistent, comes and goes", da: "Ustabil, kommer og går", sv: "Inkonsekvent, kommer och går", de: "Unbeständig, kommt und geht", ar: "غير منتظم، يأتي ويذهب" } },
      { value: 3, label: { en: "Steady but could be stronger", da: "Stabil, men kunne være stærkere", sv: "Stabil men kunde vara starkare", de: "Stabil aber könnte stärker sein", ar: "ثابت لكنه يمكن أن يكون أقوى" } },
      { value: 4, label: { en: "Strong, I'm committed to improvement", da: "Stærk, jeg er dedikeret til forbedring", sv: "Stark, jag är dedikerad till förbättring", de: "Stark, ich bin der Verbesserung verpflichtet", ar: "قوي، ملتزم بالتحسين" } },
      { value: 5, label: { en: "Burning — TKD is my passion and purpose", da: "Brændende — TKD er min passion og mit formål", sv: "Brinnande — TKD är min passion och mitt syfte", de: "Brennend — TKD ist meine Leidenschaft und mein Ziel", ar: "متقد — التايكوندو شغفي وهدفي" } },
    ],
  },
  {
    id: "mo2",
    category: "motivation",
    text: {
      en: "When my training stops improving for a while, I...",
      da: "Når min træning i en periode ikke giver fremskridt, så...",
      sv: "När min träning under en period slutar ge framsteg, så...",
      de: "Wenn mein Training eine Zeit lang keine Fortschritte bringt, dann...",
      ar: "عندما يتوقف تدريبي عن التقدم لفترة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Lose interest and consider quitting", da: "Mister interessen og overvejer at stoppe", sv: "Tappar intresset och överväger att sluta", de: "Verliere das Interesse und erwäge aufzuhören", ar: "أفقد الاهتمام وأفكر في الاستسلام" } },
      { value: 2, label: { en: "Get discouraged and train with less intensity", da: "Bliver modløs og træner med mindre intensitet", sv: "Blir modfälld och tränar med mindre intensitet", de: "Werde entmutigt und trainiere mit weniger Intensität", ar: "أصاب بالإحباط وأتدرب بكثافة أقل" } },
      { value: 3, label: { en: "Keep going but feel frustrated", da: "Fortsætter, men føler mig frustreret", sv: "Fortsätter men känner mig frustrerad", de: "Mache weiter, bin aber frustriert", ar: "أستمر لكنني أشعر بالإحباط" } },
      { value: 4, label: { en: "Trust the process and stay consistent", da: "Stoler på processen og forbliver konsekvent", sv: "Litar på processen och förblir konsekvent", de: "Vertraue dem Prozess und bleibe konsequent", ar: "أثق بالعملية وأبقى منتظمًا" } },
      { value: 5, label: { en: "Get creative — try new approaches and seek coaching", da: "Bliver kreativ — prøver nye tilgange og søger coaching", sv: "Blir kreativ — provar nya metoder och söker coaching", de: "Werde kreativ — probiere neue Ansätze und suche Coaching", ar: "أكون مبدعًا — أجرب طرقًا جديدة وأطلب التدريب" } },
    ],
  },
  {
    id: "mo3",
    category: "motivation",
    text: {
      en: "When I see others progressing faster than me, I...",
      da: "Når jeg ser andre gøre hurtigere fremskridt end mig, så...",
      sv: "När jag ser andra göra snabbare framsteg än mig, så...",
      de: "Wenn ich sehe, dass andere schneller Fortschritte machen als ich, dann...",
      ar: "عندما أرى الآخرين يتقدمون أسرع مني، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel hopeless and want to quit", da: "Føler mig håbløs og vil stoppe", sv: "Känner mig hopplös och vill sluta", de: "Fühle mich hoffnungslos und möchte aufhören", ar: "أشعر باليأس وأريد الاستسلام" } },
      { value: 2, label: { en: "Get jealous and it kills my motivation", da: "Bliver misundelig og det dræber min motivation", sv: "Blir avundsjuk och det dödar min motivation", de: "Werde eifersüchtig und es tötet meine Motivation", ar: "أشعر بالغيرة وتقتل حافزي" } },
      { value: 3, label: { en: "Feel a bit envious but keep training", da: "Føler mig lidt misundelig, men fortsætter med at træne", sv: "Känner mig lite avundsjuk men fortsätter träna", de: "Fühle etwas Neid, trainiere aber weiter", ar: "أشعر ببعض الحسد لكنني أستمر في التدريب" } },
      { value: 4, label: { en: "Use it as inspiration to train harder", da: "Bruger det som inspiration til at træne hårdere", sv: "Använder det som inspiration att träna hårdare", de: "Nutze es als Inspiration härter zu trainieren", ar: "أستخدمه كإلهام للتدريب بجدية أكبر" } },
      { value: 5, label: { en: "Celebrate their success and focus on my own journey", da: "Fejrer deres succes og fokuserer på min egen rejse", sv: "Firar deras framgång och fokuserar på min egen resa", de: "Feiere ihren Erfolg und fokussiere mich auf meinen eigenen Weg", ar: "أحتفل بنجاحهم وأركز على رحلتي الخاصة" } },
    ],
  },
  {
    id: "mo4",
    category: "motivation",
    text: {
      en: "My ability to set and follow through on training goals is...",
      da: "Min evne til at sætte og følge op på træningsmål er...",
      sv: "Min förmåga att sätta och följa upp träningsmål är...",
      de: "Meine Fähigkeit Trainingsziele zu setzen und durchzuziehen ist...",
      ar: "قدرتي على وضع أهداف التدريب ومتابعتها هي..."
    },
    options: [
      { value: 1, label: { en: "I don't set goals — I just show up when I feel like it", da: "Jeg sætter ikke mål — jeg dukker bare op når jeg har lyst", sv: "Jag sätter inga mål — jag dyker bara upp när jag känner för det", de: "Ich setze keine Ziele — ich komme einfach wenn mir danach ist", ar: "لا أضع أهدافًا — أذهب فقط عندما أشعر بذلك" } },
      { value: 2, label: { en: "I set goals but rarely follow through", da: "Jeg sætter mål, men følger sjældent op", sv: "Jag sätter mål men följer sällan upp", de: "Ich setze Ziele, aber ziehe sie selten durch", ar: "أضع أهدافًا لكنني نادرًا ما أتابعها" } },
      { value: 3, label: { en: "I set goals and sometimes achieve them", da: "Jeg sætter mål og opnår dem nogle gange", sv: "Jag sätter mål och uppnår dem ibland", de: "Ich setze Ziele und erreiche sie manchmal", ar: "أضع أهدافًا وأحققها أحيانًا" } },
      { value: 4, label: { en: "I set clear goals and track my progress consistently", da: "Jeg sætter klare mål og følger mine fremskridt konsekvent", sv: "Jag sätter tydliga mål och följer mina framsteg konsekvent", de: "Ich setze klare Ziele und verfolge meinen Fortschritt konsequent", ar: "أضع أهدافًا واضحة وأتتبع تقدمي باستمرار" } },
      { value: 5, label: { en: "I have a structured plan with short and long-term goals", da: "Jeg har en struktureret plan med kort- og langsigtede mål", sv: "Jag har en strukturerad plan med kort- och långsiktiga mål", de: "Ich habe einen strukturierten Plan mit kurz- und langfristigen Zielen", ar: "لدي خطة منظمة بأهداف قصيرة وطويلة المدى" } },
    ],
  },
  // Fatigue & Motivation
  {
    id: "fm1",
    category: "fatigueMotivation",
    text: {
      en: "How tired do you feel going into training this week?",
      da: "Hvor træt føler du dig inden denne uges træning?",
      sv: "Hur trött känner du dig inför veckans träning?",
      de: "Wie müde fühlst du dich in dieser Woche beim Training?",
      ar: "كم تشعر بالتعب قبل تدريب هذا الأسبوع؟",
    },
    variants: [
      { en: "Rate your energy tank right now — how full is it?", da: "Vurder din energitank nu — hvor fuld er den?", sv: "Betygsätt din energitank nu — hur full är den?", de: "Bewerte deinen Energietank jetzt — wie voll ist er?", ar: "قيّم خزان طاقتك الآن — كم هو ممتلئ؟" },
      { en: "Honestly — how is your body holding up this week?", da: "Ærligt talt — hvordan holder din krop den her uge?", sv: "Ärligt — hur håller sig din kropp den här veckan?", de: "Ehrlich — wie hält dein Körper diese Woche durch?", ar: "بصدق — كيف يتحمل جسمك هذا الأسبوع؟" },
    ],
    options: [
      { value: 1, label: { en: "Exhausted — I can barely function", da: "Udmattet — jeg kan næppe fungere", sv: "Utmattad — jag kan knappt fungera", de: "Erschöpft — ich kann kaum funktionieren", ar: "منهك تمامًا — بالكاد أستطيع العمل" } },
      { value: 2, label: { en: "Very tired — my body feels heavy and slow", da: "Meget træt — min krop føles tung og langsom", sv: "Väldigt trött — min kropp känns tung och långsam", de: "Sehr müde — mein Körper fühlt sich schwer und langsam an", ar: "متعب جدًا — جسمي يشعر بثقل وبطء" } },
      { value: 3, label: { en: "Somewhat tired but I can still train", da: "Noget træt, men jeg kan stadig træne", sv: "Lite trött men jag kan fortfarande träna", de: "Etwas müde, aber ich kann noch trainieren", ar: "متعب نوعًا ما لكنني أستطيع التدريب" } },
      { value: 4, label: { en: "Good energy — I feel fresh and ready", da: "God energi — jeg føler mig frisk og klar", sv: "Bra energi — jag känner mig fräsch och redo", de: "Gute Energie — ich fühle mich frisch und bereit", ar: "طاقة جيدة — أشعر بالانتعاش والاستعداد" } },
      { value: 5, label: { en: "Full tank — I feel the best I have in weeks", da: "Fuld tank — jeg har det bedre end i ugevis", sv: "Full tank — jag mår bättre än på veckor", de: "Voller Tank — ich fühle mich so gut wie seit Wochen nicht", ar: "خزان ممتلئ — أشعر بأفضل حال منذ أسابيع" } },
    ],
  },
  {
    id: "fm2",
    category: "fatigueMotivation",
    text: {
      en: "When I think about my training goals right now, I feel...",
      da: "Når jeg tænker på mine træningsmål lige nu, føler jeg mig...",
      sv: "När jag tänker på mina träningsmål just nu, känner jag mig...",
      de: "Wenn ich jetzt an meine Trainingsziele denke, fühle ich mich...",
      ar: "عندما أفكر في أهدافي التدريبية الآن، أشعر..."
    },
    variants: [
      { en: "Do your goals still excite you or do they feel like a burden?", da: "Begejstrer dine mål dig stadig, eller føles de som en byrde?", sv: "Engagerar dina mål dig fortfarande eller känns de som en börda?", de: "Begeistern dich deine Ziele noch oder fühlen sie sich wie eine Last an?", ar: "هل لا تزال أهدافك تثيرك أم أنها تبدو كعبء؟" },
      { en: "What's your gut feeling about your training right now?", da: "Hvad er din mavefornemmelse om din træning lige nu?", sv: "Vad är din känsla för din träning just nu?", de: "Was ist dein Bauchgefühl für dein Training gerade?", ar: "ما هو شعورك الحدسي تجاه تدريبك الآن؟" },
    ],
    options: [
      { value: 1, label: { en: "My goals feel meaningless right now", da: "Mine mål føles meningsløse lige nu", sv: "Mina mål känns meningslösa just nu", de: "Meine Ziele fühlen sich gerade bedeutungslos an", ar: "أهدافي تبدو بلا معنى الآن" } },
      { value: 2, label: { en: "Disconnected — I'm going through the motions", da: "Afkoblet — jeg går bare igennem bevægelserne", sv: "Frånkopplad — jag bara går igenom rörelserna", de: "Abgekoppelt — ich gehe nur durch die Bewegungen", ar: "منفصل — أؤدي الحركات فقط" } },
      { value: 3, label: { en: "Neutral — I'm not inspired but not giving up", da: "Neutral — jeg er ikke inspireret men giver ikke op", sv: "Neutral — jag är inte inspirerad men ger inte upp", de: "Neutral — ich bin nicht inspiriert, gebe aber nicht auf", ar: "محايد — لست ملهمًا لكنني لا أستسلم" } },
      { value: 4, label: { en: "Engaged — my goals feel relevant and motivating", da: "Engageret — mine mål føles relevante og motiverende", sv: "Engagerad — mina mål känns relevanta och motiverande", de: "Engagiert — meine Ziele fühlen sich relevant und motivierend an", ar: "مشارك — أهدافي تبدو ذات صلة ومحفزة" } },
      { value: 5, label: { en: "On fire — I know exactly why I train and I can't wait", da: "I flammer — jeg ved præcis hvorfor jeg træner og kan ikke vente", sv: "I brand — jag vet exakt varför jag tränar och kan inte vänta", de: "Brennend — ich weiß genau warum ich trainiere und kann es kaum erwarten", ar: "متحمس — أعرف بالضبط لماذا أتدرب ولا أستطيع الانتظار" } },
    ],
  },
  {
    id: "fm3",
    category: "fatigueMotivation",
    text: {
      en: "How has your sleep and recovery been this week?",
      da: "Hvordan har din søvn og restitution været denne uge?",
      sv: "Hur har din sömn och återhämtning varit den här veckan?",
      de: "Wie war dein Schlaf und deine Erholung diese Woche?",
      ar: "كيف كان نومك وتعافيك هذا الأسبوع؟"
    },
    variants: [
      { en: "Is your body getting enough time to rebuild between sessions?", da: "Får din krop nok tid til at genopbygge mellem sessionerne?", sv: "Får din kropp tillräckligt med tid att återuppbygga sig mellan passen?", de: "Bekommt dein Körper genug Zeit um sich zwischen den Einheiten zu regenerieren?", ar: "هل يحصل جسمك على وقت كافٍ للتعافي بين الجلسات؟" },
      { en: "Describe your recovery game this week in one answer:", da: "Beskriv dit restitutionsspil denne uge med ét svar:", sv: "Beskriv din återhämtning den här veckan med ett svar:", de: "Beschreibe deine Erholung diese Woche in einer Antwort:", ar: "صِف تعافيك هذا الأسبوع بإجابة واحدة:" },
    ],
    options: [
      { value: 1, label: { en: "Poor sleep, no recovery routines, feeling wrecked", da: "Dårlig søvn, ingen restitutionsrutiner, føler mig ødelagt", sv: "Dålig sömn, inga återhämtningsrutiner, känner mig förstörd", de: "Schlechter Schlaf, keine Erholungsroutinen, fühle mich kaputt", ar: "نوم سيئ، لا روتين للتعافي، أشعر بالإنهاك" } },
      { value: 2, label: { en: "Broken sleep, some soreness, not recovering well", da: "Afbrudt søvn, lidt ømhed, restituerer ikke godt", sv: "Bruten sömn, lite ömhet, återhämtar mig inte bra", de: "Unterbrochener Schlaf, etwas Muskelkater, erhole mich nicht gut", ar: "نوم متقطع، بعض الألم، لا أتعافى بشكل جيد" } },
      { value: 3, label: { en: "Okay sleep, some recovery but not optimal", da: "Okay søvn, noget restitution men ikke optimalt", sv: "Okej sömn, viss återhämtning men inte optimal", de: "Okay Schlaf, etwas Erholung aber nicht optimal", ar: "نوم مقبول، بعض التعافي لكن ليس مثالياً" } },
      { value: 4, label: { en: "Good sleep, body feels fresh between sessions", da: "God søvn, kroppen føles frisk mellem sessionerne", sv: "Bra sömn, kroppen känns fräsch mellan passen", de: "Guter Schlaf, Körper fühlt sich frisch zwischen den Einheiten an", ar: "نوم جيد، الجسم يشعر بالانتعاش بين الجلسات" } },
      { value: 5, label: { en: "Excellent sleep + active recovery — I feel supercharged", da: "Fremragende søvn + aktiv restitution — jeg føler mig supersuppleret", sv: "Utmärkt sömn + aktiv återhämtning — jag känner mig superladdad", de: "Ausgezeichneter Schlaf + aktive Erholung — ich fühle mich aufgeladen", ar: "نوم ممتاز + تعافٍ نشط — أشعر بطاقة فائقة" } },
    ],
  },
  {
    id: "fm4",
    category: "fatigueMotivation",
    text: {
      en: "Right now, how much do you genuinely want to be at training?",
      da: "Lige nu, hvor meget vil du egentlig gerne være til træning?",
      sv: "Just nu, hur mycket vill du verkligen vara på träning?",
      de: "Gerade jetzt, wie sehr möchtest du wirklich beim Training sein?",
      ar: "الآن، كم تريد حقًا أن تكون في التدريب؟"
    },
    variants: [
      { en: "If training was optional today, would you still show up?", da: "Hvis træning var valgfrit i dag, ville du stadig møde op?", sv: "Om träningen var frivillig idag, skulle du ändå dyka upp?", de: "Wenn das Training heute optional wäre, würdest du trotzdem kommen?", ar: "إذا كان التدريب اختياريًا اليوم، هل ستحضر رغم ذلك؟" },
      { en: "Be honest — what's pulling you toward or away from the mat today?", da: "Vær ærlig — hvad trækker dig mod eller væk fra måtten i dag?", sv: "Var ärlig — vad drar dig mot eller ifrån mattan idag?", de: "Sei ehrlich — was zieht dich heute zur Matte hin oder davon weg?", ar: "كن صادقًا — ما الذي يجذبك نحو الحلبة أو يبعدك عنها اليوم؟" },
    ],
    options: [
      { value: 1, label: { en: "I really don't want to be here — I'm just going through the motions", da: "Jeg vil virkelig ikke være her — jeg går bare igennem bevægelserne", sv: "Jag vill verkligen inte vara här — jag bara går igenom rörelserna", de: "Ich will wirklich nicht hier sein — ich gehe nur durch die Bewegungen", ar: "لا أريد حقًا أن أكون هنا — أؤدي الحركات فقط" } },
      { value: 2, label: { en: "Forced myself to come — motivation is at a low point", da: "Tvang mig selv til at komme — motivationen er på et lavpunkt", sv: "Tvingade mig att komma — motivationen är på ett lågt punkt", de: "Zwang mich zu kommen — Motivation ist auf einem Tiefpunkt", ar: "أجبرت نفسي على الحضور — الحافز في أدنى مستوياته" } },
      { value: 3, label: { en: "I'm here, I'll do my best — but the spark isn't there today", da: "Jeg er her, jeg gør mit bedste — men gnisten er ikke der i dag", sv: "Jag är här, gör mitt bästa — men gnistan är inte där idag", de: "Ich bin hier, gebe mein Bestes — aber der Funke ist heute nicht da", ar: "أنا هنا، سأبذل قصارى جهدي — لكن الشرارة ليست هناك اليوم" } },
      { value: 4, label: { en: "I want to be here and I'm ready to work hard", da: "Jeg vil gerne være her og er klar til at arbejde hårdt", sv: "Jag vill vara här och är redo att jobba hårt", de: "Ich möchte hier sein und bin bereit hart zu arbeiten", ar: "أريد أن أكون هنا وأنا مستعد للعمل بجد" } },
      { value: 5, label: { en: "This is exactly where I want to be — let's go!", da: "Det er præcis her jeg vil være — lad os komme i gang!", sv: "Det är precis här jag vill vara — sätt igång!", de: "Genau hier möchte ich sein — los geht's!", ar: "هذا هو بالضبط المكان الذي أريد أن أكون فيه — هيا نبدأ!" } },
    ],
  },
];

/** Junior questions (age < 15) — simpler language, relatable scenarios */
export const juniorQuestions: MentalQuestion[] = [
  // Mental Toughness
  {
    id: "mt1",
    category: "mentalToughness",
    text: {
      en: "When training feels really tough and I'm tired, I...",
      da: "Når træningen føles rigtig hård og jeg er træt, så...",
      sv: "När träningen känns riktigt tuff och jag är trött, så...",
      de: "Wenn das Training sich richtig hart anfühlt und ich müde bin, dann...",
      ar: "عندما يكون التدريب صعبًا جدًا وأنا متعب، أنا..."
    },
    options: [
      { value: 1, label: { en: "Want to stop and sit down", da: "Har lyst til at stoppe og sætte mig", sv: "Vill sluta och sätta mig", de: "Will aufhören und mich hinsetzen", ar: "أريد التوقف والجلوس" } },
      { value: 2, label: { en: "Try a little but usually give up", da: "Prøver lidt, men giver som regel op", sv: "Försöker lite men ger oftast upp", de: "Versuche es ein wenig, gebe aber meist auf", ar: "أحاول قليلًا لكنني عادة أستسلم" } },
      { value: 3, label: { en: "Keep going even though it's hard", da: "Fortsætter selvom det er hårdt", sv: "Fortsätter trots att det är svårt", de: "Mache weiter obwohl es hart ist", ar: "أستمر رغم أنه صعب" } },
      { value: 4, label: { en: "Tell myself 'I can do this' and push through", da: "Siger til mig selv 'det kan jeg godt' og presser igennem", sv: "Säger till mig själv 'jag klarar det' och pressar igenom", de: "Sage mir 'ich schaffe das' und kämpfe mich durch", ar: "أقول لنفسي 'أستطيع فعل هذا' وأتحمل" } },
      { value: 5, label: { en: "Love it when it's hard — that's when I grow!", da: "Elsker det når det er hårdt — det er der jeg bliver bedre!", sv: "Älskar det när det är svårt — det är då jag växer!", de: "Liebe es wenn es hart ist — dann wachse ich!", ar: "أحبه عندما يكون صعبًا — هنا أنمو!" } },
    ],
  },
  {
    id: "mt2",
    category: "mentalToughness",
    text: {
      en: "When I'm losing in a match, I...",
      da: "Når jeg er ved at tabe en kamp, så...",
      sv: "När jag håller på att förlora en match, så...",
      de: "Wenn ich in einem Kampf verliere, dann...",
      ar: "عندما أخسر في مباراة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Get really upset and want to cry", da: "Bliver rigtig ked af det og har lyst til at græde", sv: "Blir riktigt ledsen och vill gråta", de: "Bin richtig traurig und möchte weinen", ar: "أنزعج كثيرًا وأريد البكاء" } },
      { value: 2, label: { en: "Get angry and make silly mistakes", da: "Bliver sur og laver dumme fejl", sv: "Blir arg och gör dumma misstag", de: "Werde wütend und mache dumme Fehler", ar: "أغضب وأرتكب أخطاء سخيفة" } },
      { value: 3, label: { en: "Try to stay calm and keep fighting", da: "Prøver at forblive rolig og kæmpe videre", sv: "Försöker hålla mig lugn och fortsätta kämpa", de: "Versuche ruhig zu bleiben und weiterzukämpfen", ar: "أحاول البقاء هادئًا وأستمر في القتال" } },
      { value: 4, label: { en: "Think about what I can do differently", da: "Tænker over hvad jeg kan gøre anderledes", sv: "Tänker på vad jag kan göra annorlunda", de: "Denke darüber nach was ich anders machen kann", ar: "أفكر فيما يمكنني فعله بشكل مختلف" } },
      { value: 5, label: { en: "Fight even harder — I never give up!", da: "Kæmper endnu hårdere — jeg giver aldrig op!", sv: "Kämpar ännu hårdare — jag ger aldrig upp!", de: "Kämpfe noch härter — ich gebe niemals auf!", ar: "أقاتل بقوة أكبر — لا أستسلم أبدًا!" } },
    ],
  },
  {
    id: "mt3",
    category: "mentalToughness",
    text: {
      en: "When something hurts a little during training, I...",
      da: "Når noget gør lidt ondt under træningen, så...",
      sv: "När något gör lite ont under träningen, så...",
      de: "Wenn etwas beim Training ein wenig wehtut, dann...",
      ar: "عندما يؤلمني شيء قليلًا أثناء التدريب، أنا..."
    },
    options: [
      { value: 1, label: { en: "Stop right away and don't want to continue", da: "Stopper med det samme og vil ikke fortsætte", sv: "Slutar direkt och vill inte fortsätta", de: "Höre sofort auf und will nicht weitermachen", ar: "أتوقف فورًا ولا أريد الاستمرار" } },
      { value: 2, label: { en: "Get worried and it's hard to focus", da: "Bliver bekymret og det er svært at koncentrere mig", sv: "Blir orolig och det är svårt att koncentrera mig", de: "Werde besorgt und es fällt mir schwer mich zu konzentrieren", ar: "أقلق ويصعب علي التركيز" } },
      { value: 3, label: { en: "Tell my coach and try to keep going", da: "Fortæller min træner og prøver at fortsætte", sv: "Berättar för min tränare och försöker fortsätta", de: "Sage es meinem Trainer und versuche weiterzumachen", ar: "أخبر مدربي وأحاول الاستمرار" } },
      { value: 4, label: { en: "Check if it's serious, then keep training carefully", da: "Tjekker om det er alvorligt og træner derefter forsigtigt videre", sv: "Kollar om det är allvarligt och tränar sedan vidare försiktigt", de: "Prüfe ob es ernst ist und trainiere dann vorsichtig weiter", ar: "أتحقق إذا كان خطيرًا، ثم أستمر بحذر" } },
      { value: 5, label: { en: "Know it's normal and keep going with a smile", da: "Ved det er normalt og fortsætter med et smil", sv: "Vet att det är normalt och fortsätter med ett leende", de: "Weiß dass es normal ist und mache lächelnd weiter", ar: "أعلم أنه طبيعي وأستمر بابتسامة" } },
    ],
  },
  // Competition Anxiety
  {
    id: "ca1",
    category: "competitionAnxiety",
    text: {
      en: "Before a competition, I feel...",
      da: "Før et stævne føler jeg mig...",
      sv: "Före en tävling känner jag mig...",
      de: "Vor einem Wettkampf fühle ich mich...",
      ar: "قبل المنافسة، أشعر..."
    },
    options: [
      { value: 1, label: { en: "So nervous I feel sick and don't want to go", da: "Så nervøs at jeg har ondt i maven og ikke vil afsted", sv: "Så nervös att jag mår illa och inte vill åka", de: "So nervös dass mir schlecht wird und ich nicht hin will", ar: "بالتوتر الشديد حتى أشعر بالمرض ولا أريد الذهاب" } },
      { value: 2, label: { en: "Really worried and can't think straight", da: "Rigtig bekymret og kan ikke tænke klart", sv: "Riktigt orolig och kan inte tänka klart", de: "Wirklich besorgt und kann nicht klar denken", ar: "قلق جدًا ولا أستطيع التفكير بوضوح" } },
      { value: 3, label: { en: "A bit nervous but also excited", da: "Lidt nervøs, men også spændt", sv: "Lite nervös men också spänd", de: "Ein bisschen nervös aber auch aufgeregt", ar: "متوتر قليلًا لكنني متحمس أيضًا" } },
      { value: 4, label: { en: "Excited and ready to show what I can do", da: "Spændt og klar til at vise hvad jeg kan", sv: "Spänd och redo att visa vad jag kan", de: "Aufgeregt und bereit zu zeigen was ich kann", ar: "متحمس ومستعد لإظهار ما أستطيع فعله" } },
      { value: 5, label: { en: "Super excited — competitions are the best!", da: "Mega spændt — stævner er det bedste!", sv: "Superspänd — tävlingar är det bästa!", de: "Super aufgeregt — Wettkämpfe sind das Beste!", ar: "متحمس جدًا — المنافسات هي الأفضل!" } },
    ],
  },
  {
    id: "ca2",
    category: "competitionAnxiety",
    text: {
      en: "When I'm about to step onto the mat, my body feels...",
      da: "Når jeg skal ind på måtten, føles min krop...",
      sv: "När jag ska kliva ut på mattan, känns min kropp...",
      de: "Wenn ich gleich auf die Matte trete, fühlt sich mein Körper...",
      ar: "عندما أكون على وشك الصعود للحلبة، جسمي يشعر..."
    },
    options: [
      { value: 1, label: { en: "Shaky and my tummy hurts", da: "Rystende og min mave gør ondt", sv: "Skakig och min mage gör ont", de: "Zittrig und mein Bauch tut weh", ar: "مرتعش ومعدتي تؤلمني" } },
      { value: 2, label: { en: "Stiff and tense all over", da: "Stiv og anspændt over det hele", sv: "Stel och spänd överallt", de: "Steif und überall angespannt", ar: "متصلب ومتوتر في كل مكان" } },
      { value: 3, label: { en: "A little tingly but okay", da: "Lidt kriblende, men okay", sv: "Lite pirrigt men okej", de: "Ein wenig kribbelig aber okay", ar: "وخز خفيف لكن بخير" } },
      { value: 4, label: { en: "Strong and full of energy", da: "Stærk og fuld af energi", sv: "Stark och full av energi", de: "Stark und voller Energie", ar: "قوي ومليء بالطاقة" } },
      { value: 5, label: { en: "Like a superhero ready to go!", da: "Som en superhelt klar til kamp!", sv: "Som en superhjälte redo att köra!", de: "Wie ein Superheld bereit loszulegen!", ar: "مثل بطل خارق مستعد للانطلاق!" } },
    ],
  },
  {
    id: "ca3",
    category: "competitionAnxiety",
    text: {
      en: "The night before a competition, I...",
      da: "Aftenen før et stævne...",
      sv: "Kvällen före en tävling...",
      de: "Am Abend vor einem Wettkampf...",
      ar: "في الليلة السابقة للمنافسة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Can't sleep at all, keep thinking about it", da: "Kan slet ikke sove, tænker hele tiden på det", sv: "Kan inte sova alls, tänker hela tiden på det", de: "Kann gar nicht schlafen, denke die ganze Zeit daran", ar: "لا أستطيع النوم أبدًا، أفكر فيه باستمرار" } },
      { value: 2, label: { en: "Have trouble falling asleep", da: "Har svært ved at falde i søvn", sv: "Har svårt att somna", de: "Habe Schwierigkeiten einzuschlafen", ar: "أواجه صعوبة في النوم" } },
      { value: 3, label: { en: "Sleep okay but wake up early", da: "Sover okay, men vågner tidligt", sv: "Sover okej men vaknar tidigt", de: "Schlafe okay, aber wache früh auf", ar: "أنام بشكل مقبول لكنني أستيقظ مبكرًا" } },
      { value: 4, label: { en: "Sleep well because I know I'm prepared", da: "Sover godt fordi jeg ved jeg er forberedt", sv: "Sover bra för jag vet att jag är förberedd", de: "Schlafe gut weil ich weiß dass ich vorbereitet bin", ar: "أنام جيدًا لأنني أعلم أنني مستعد" } },
      { value: 5, label: { en: "Sleep great — I'm excited for tomorrow!", da: "Sover fantastisk — jeg glæder mig til i morgen!", sv: "Sover jättebra — jag ser fram emot imorgon!", de: "Schlafe toll — ich freue mich auf morgen!", ar: "أنام رائعًا — أنا متحمس لغدًا!" } },
    ],
  },
  // Focus & Concentration
  {
    id: "fc1",
    category: "focusConcentration",
    text: {
      en: "During training, my focus is...",
      da: "Under træningen er mit fokus...",
      sv: "Under träningen är mitt fokus...",
      de: "Während des Trainings ist mein Fokus...",
      ar: "خلال التدريب، تركيزي..."
    },
    options: [
      { value: 1, label: { en: "I get distracted a lot and look around", da: "Jeg bliver distraheret meget og kigger rundt", sv: "Jag blir distraherad mycket och tittar runt", de: "Ich werde oft abgelenkt und schaue mich um", ar: "أتشتت كثيرًا وأنظر حولي" } },
      { value: 2, label: { en: "Sometimes my mind wanders to other things", da: "Nogle gange vandrer mine tanker hen til andre ting", sv: "Ibland vandrar mina tankar till andra saker", de: "Manchmal schweifen meine Gedanken zu anderen Dingen", ar: "أحيانًا يشرد ذهني لأشياء أخرى" } },
      { value: 3, label: { en: "Pretty good, I usually pay attention", da: "Ret godt, jeg er normalt opmærksom", sv: "Ganska bra, jag brukar vara uppmärksam", de: "Ziemlich gut, ich passe normalerweise auf", ar: "جيد جدًا، عادة أكون منتبهًا" } },
      { value: 4, label: { en: "Really focused on what my coach says", da: "Rigtig fokuseret på hvad min træner siger", sv: "Riktigt fokuserad på vad min tränare säger", de: "Wirklich fokussiert auf das was mein Trainer sagt", ar: "مركّز جدًا على ما يقوله مدربي" } },
      { value: 5, label: { en: "100% focused — I notice every detail", da: "100% fokuseret — jeg lægger mærke til alle detaljer", sv: "100% fokuserad — jag lägger märke till varje detalj", de: "100% fokussiert — ich bemerke jedes Detail", ar: "100% مركّز — ألاحظ كل تفصيل" } },
    ],
  },
  {
    id: "fc2",
    category: "focusConcentration",
    text: {
      en: "When people are watching or cheering loudly, I...",
      da: "Når folk kigger på eller hepper højt, så...",
      sv: "När folk tittar på eller hejar högt, så...",
      de: "Wenn Leute zuschauen oder laut anfeuern, dann...",
      ar: "عندما يشاهدني الناس أو يشجعون بصوت عالٍ، أنا..."
    },
    options: [
      { value: 1, label: { en: "Get really distracted and mess up", da: "Bliver rigtig distraheret og laver fejl", sv: "Blir riktigt distraherad och gör fel", de: "Werde richtig abgelenkt und mache Fehler", ar: "أتشتت جدًا وأخطئ" } },
      { value: 2, label: { en: "Feel nervous and forget what to do", da: "Bliver nervøs og glemmer hvad jeg skal gøre", sv: "Blir nervös och glömmer vad jag ska göra", de: "Werde nervös und vergesse was ich tun soll", ar: "أشعر بالتوتر وأنسى ما يجب فعله" } },
      { value: 3, label: { en: "Notice them but can still focus", da: "Lægger mærke til dem, men kan stadig fokusere", sv: "Noterar dem men kan fortfarande fokusera", de: "Bemerke sie, kann mich aber trotzdem konzentrieren", ar: "ألاحظهم لكنني أستطيع التركيز" } },
      { value: 4, label: { en: "It makes me try harder", da: "Det får mig til at prøve hårdere", sv: "Det får mig att försöka hårdare", de: "Es bringt mich dazu härter zu versuchen", ar: "يجعلني أحاول بجدية أكبر" } },
      { value: 5, label: { en: "Love it — it gives me extra energy!", da: "Elsker det — det giver mig ekstra energi!", sv: "Älskar det — det ger mig extra energi!", de: "Liebe es — es gibt mir extra Energie!", ar: "أحبه — يعطيني طاقة إضافية!" } },
    ],
  },
  {
    id: "fc3",
    category: "focusConcentration",
    text: {
      en: "When I make a mistake during a match, I...",
      da: "Når jeg laver en fejl under en kamp, så...",
      sv: "När jag gör ett misstag under en match, så...",
      de: "Wenn ich während eines Kampfes einen Fehler mache, dann...",
      ar: "عندما أرتكب خطأ أثناء مباراة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Keep thinking about it and can't move on", da: "Bliver ved med at tænke på det og kan ikke komme videre", sv: "Fortsätter tänka på det och kan inte gå vidare", de: "Denke ständig daran und kann nicht weitermachen", ar: "أستمر في التفكير فيه ولا أستطيع المضي قدمًا" } },
      { value: 2, label: { en: "Get upset and make more mistakes", da: "Bliver ked af det og laver flere fejl", sv: "Blir ledsen och gör fler misstag", de: "Bin traurig und mache mehr Fehler", ar: "أنزعج وأرتكب المزيد من الأخطاء" } },
      { value: 3, label: { en: "Feel bad for a moment but then try again", da: "Føler mig dårlig et øjeblik, men prøver igen", sv: "Mår dåligt en stund men försöker igen", de: "Fühle mich kurz schlecht, versuche es aber wieder", ar: "أشعر بالسوء للحظة ثم أحاول مرة أخرى" } },
      { value: 4, label: { en: "Quickly forget it and focus on the next move", da: "Glemmer det hurtigt og fokuserer på næste bevægelse", sv: "Glömmer det snabbt och fokuserar på nästa drag", de: "Vergesse es schnell und konzentriere mich auf den nächsten Zug", ar: "أنساه بسرعة وأركز على الحركة التالية" } },
      { value: 5, label: { en: "Learn from it immediately and do better", da: "Lærer af det med det samme og gør det bedre", sv: "Lär mig av det direkt och gör bättre", de: "Lerne sofort daraus und mache es besser", ar: "أتعلم منه فورًا وأفعل الأفضل" } },
    ],
  },
  // Recovery from Loss
  {
    id: "rl1",
    category: "recoveryFromLoss",
    text: {
      en: "After I lose a match, I...",
      da: "Efter jeg taber en kamp, så...",
      sv: "Efter att jag förlorar en match, så...",
      de: "Nachdem ich einen Kampf verloren habe, dann...",
      ar: "بعد أن أخسر مباراة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel really sad and don't want to train anymore", da: "Bliver rigtig ked af det og har ikke lyst til at træne mere", sv: "Blir riktigt ledsen och vill inte träna mer", de: "Bin richtig traurig und möchte nicht mehr trainieren", ar: "أشعر بالحزن الشديد ولا أريد التدريب بعد الآن" } },
      { value: 2, label: { en: "Am sad for a long time and it's hard to be happy again", da: "Er ked af det længe og det er svært at blive glad igen", sv: "Är ledsen länge och det är svårt att bli glad igen", de: "Bin lange traurig und es ist schwer wieder fröhlich zu sein", ar: "أكون حزينًا لفترة طويلة ومن الصعب أن أكون سعيدًا مرة أخرى" } },
      { value: 3, label: { en: "Feel disappointed but I'm okay the next day", da: "Føler mig skuffet, men er okay næste dag", sv: "Känner mig besviken men jag är okej nästa dag", de: "Bin enttäuscht, bin aber am nächsten Tag okay", ar: "أشعر بخيبة أمل لكنني بخير في اليوم التالي" } },
      { value: 4, label: { en: "Think about what I can improve next time", da: "Tænker på hvad jeg kan forbedre næste gang", sv: "Tänker på vad jag kan förbättra nästa gång", de: "Denke darüber nach was ich nächstes Mal verbessern kann", ar: "أفكر فيما يمكنني تحسينه في المرة القادمة" } },
      { value: 5, label: { en: "Know that losing helps me learn and get better", da: "Ved at tabe hjælper mig med at lære og blive bedre", sv: "Vet att förlora hjälper mig att lära och bli bättre", de: "Weiß dass Verlieren mir hilft zu lernen und besser zu werden", ar: "أعلم أن الخسارة تساعدني على التعلم والتحسن" } },
    ],
  },
  {
    id: "rl2",
    category: "recoveryFromLoss",
    text: {
      en: "When my coach gives me corrections, I...",
      da: "Når min træner retter mig, så...",
      sv: "När min tränare rättar mig, så...",
      de: "Wenn mein Trainer mich korrigiert, dann...",
      ar: "عندما يصحح مدربي لي، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel bad about myself and want to stop", da: "Har det dårligt med mig selv og vil stoppe", sv: "Mår dåligt om mig själv och vill sluta", de: "Fühle mich schlecht und möchte aufhören", ar: "أشعر بالسوء تجاه نفسي وأريد التوقف" } },
      { value: 2, label: { en: "Get frustrated because I can't do it right", da: "Bliver frustreret fordi jeg ikke kan gøre det rigtigt", sv: "Blir frustrerad för att jag inte kan göra det rätt", de: "Bin frustriert weil ich es nicht richtig machen kann", ar: "أشعر بالإحباط لأنني لا أستطيع فعلها بشكل صحيح" } },
      { value: 3, label: { en: "Listen and try to fix it", da: "Lytter og prøver at rette det", sv: "Lyssnar och försöker rätta till det", de: "Höre zu und versuche es zu korrigieren", ar: "أستمع وأحاول إصلاحه" } },
      { value: 4, label: { en: "Am happy to learn something new", da: "Er glad for at lære noget nyt", sv: "Är glad att lära mig något nytt", de: "Bin froh etwas Neues zu lernen", ar: "أكون سعيدًا بتعلم شيء جديد" } },
      { value: 5, label: { en: "Love getting feedback — it makes me better!", da: "Elsker at få feedback — det gør mig bedre!", sv: "Älskar att få feedback — det gör mig bättre!", de: "Liebe Feedback — es macht mich besser!", ar: "أحب الحصول على ملاحظات — تجعلني أفضل!" } },
    ],
  },
  {
    id: "rl3",
    category: "recoveryFromLoss",
    text: {
      en: "When a friend at the club is better than me at something, I...",
      da: "Når en ven i klubben er bedre end mig til noget, så...",
      sv: "När en kompis i klubben är bättre än mig på något, så...",
      de: "Wenn ein Freund im Verein besser ist als ich in etwas, dann...",
      ar: "عندما يكون صديق في النادي أفضل مني في شيء ما، أنا..."
    },
    options: [
      { value: 1, label: { en: "Feel bad and don't want to try that thing", da: "Har det dårligt og vil ikke prøve den ting", sv: "Mår dåligt och vill inte prova det", de: "Fühle mich schlecht und möchte es nicht versuchen", ar: "أشعر بالسوء ولا أريد تجربة ذلك" } },
      { value: 2, label: { en: "Get a bit sad and compare myself to them", da: "Bliver lidt ked af det og sammenligner mig med dem", sv: "Blir lite ledsen och jämför mig med dem", de: "Bin ein bisschen traurig und vergleiche mich mit ihnen", ar: "أحزن قليلًا وأقارن نفسي بهم" } },
      { value: 3, label: { en: "Think it's okay, everyone is good at different things", da: "Tænker det er okay, alle er gode til forskellige ting", sv: "Tänker att det är okej, alla är bra på olika saker", de: "Denke es ist okay, jeder ist gut in verschiedenen Dingen", ar: "أعتقد أنه لا بأس، كل شخص جيد في أشياء مختلفة" } },
      { value: 4, label: { en: "Ask them to help me learn it too", da: "Beder dem om at hjælpe mig med at lære det også", sv: "Ber dem hjälpa mig att lära mig det också", de: "Bitte sie mir zu helfen es auch zu lernen", ar: "أطلب منهم مساعدتي في تعلمه أيضًا" } },
      { value: 5, label: { en: "Feel happy for them and work hard to improve too", da: "Er glad for dem og arbejder hårdt på også at forbedre mig", sv: "Är glad för dem och jobbar hårt för att förbättra mig också", de: "Bin froh für sie und arbeite hart um mich auch zu verbessern", ar: "أكون سعيدًا لأجلهم وأعمل بجد لأتحسن أيضًا" } },
    ],
  },
  // Confidence
  {
    id: "cf1",
    category: "confidence",
    text: {
      en: "How much do I believe in myself as a taekwondo athlete?",
      da: "Hvor meget tror jeg på mig selv som taekwondo-atlet?",
      sv: "Hur mycket tror jag på mig själv som taekwondoutövare?",
      de: "Wie sehr glaube ich an mich selbst als Taekwondo-Athlet?",
      ar: "كم أؤمن بنفسي كرياضي تايكوندو؟"
    },
    options: [
      { value: 1, label: { en: "I don't think I'm any good", da: "Jeg tror ikke jeg er god", sv: "Jag tror inte att jag är bra", de: "Ich glaube nicht dass ich gut bin", ar: "لا أعتقد أنني جيد" } },
      { value: 2, label: { en: "I'm not sure if I'm good enough", da: "Jeg er ikke sikker på om jeg er god nok", sv: "Jag är inte säker på om jag är tillräckligt bra", de: "Ich bin nicht sicher ob ich gut genug bin", ar: "لست متأكدًا إذا كنت جيدًا بما فيه الكفاية" } },
      { value: 3, label: { en: "Sometimes I feel good, sometimes not", da: "Nogle gange føler jeg mig god, andre gange ikke", sv: "Ibland känner jag mig bra, ibland inte", de: "Manchmal fühle ich mich gut, manchmal nicht", ar: "أحيانًا أشعر بالثقة، وأحيانًا لا" } },
      { value: 4, label: { en: "I believe in myself and my training", da: "Jeg tror på mig selv og min træning", sv: "Jag tror på mig själv och min träning", de: "Ich glaube an mich und mein Training", ar: "أؤمن بنفسي وتدريبي" } },
      { value: 5, label: { en: "I know I'm good and getting better every day!", da: "Jeg ved jeg er god og bliver bedre hver dag!", sv: "Jag vet att jag är bra och blir bättre varje dag!", de: "Ich weiß dass ich gut bin und jeden Tag besser werde!", ar: "أعلم أنني جيد وأتحسن كل يوم!" } },
    ],
  },
  {
    id: "cf2",
    category: "confidence",
    text: {
      en: "When I have to fight someone bigger or more experienced, I...",
      da: "Når jeg skal kæmpe mod en der er større eller mere erfaren, så...",
      sv: "När jag ska möta någon som är större eller mer erfaren, så...",
      de: "Wenn ich gegen jemanden kämpfen muss der größer oder erfahrener ist, dann...",
      ar: "عندما يجب أن أقاتل شخصًا أكبر أو أكثر خبرة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Think I have no chance and feel scared", da: "Tror jeg ikke har nogen chance og bliver bange", sv: "Tror att jag inte har en chans och blir rädd", de: "Denke ich habe keine Chance und bekomme Angst", ar: "أعتقد أنه ليس لدي فرصة وأشعر بالخوف" } },
      { value: 2, label: { en: "Feel nervous and don't really try my best", da: "Bliver nervøs og prøver ikke rigtig mit bedste", sv: "Blir nervös och försöker inte riktigt mitt bästa", de: "Bin nervös und gebe nicht wirklich mein Bestes", ar: "أشعر بالتوتر ولا أبذل قصارى جهدي حقًا" } },
      { value: 3, label: { en: "Feel a bit worried but still try", da: "Føler mig lidt bekymret, men prøver stadig", sv: "Känner mig lite orolig men försöker ändå", de: "Bin ein wenig besorgt, versuche es aber trotzdem", ar: "أشعر بالقلق قليلًا لكنني أحاول" } },
      { value: 4, label: { en: "See it as a fun challenge", da: "Ser det som en sjov udfordring", sv: "Ser det som en rolig utmaning", de: "Sehe es als lustige Herausforderung", ar: "أراه كتحدٍ ممتع" } },
      { value: 5, label: { en: "Get excited — I want to show what I can do!", da: "Bliver spændt — jeg vil vise hvad jeg kan!", sv: "Blir exalterad — jag vill visa vad jag kan!", de: "Bin aufgeregt — ich will zeigen was ich kann!", ar: "أتحمس — أريد أن أُظهر ما أستطيع فعله!" } },
    ],
  },
  {
    id: "cf3",
    category: "confidence",
    text: {
      en: "When I try a new kick or technique, I...",
      da: "Når jeg prøver et nyt spark eller en ny teknik, så...",
      sv: "När jag provar en ny spark eller teknik, så...",
      de: "Wenn ich einen neuen Kick oder eine neue Technik versuche, dann...",
      ar: "عندما أجرب ركلة أو تقنية جديدة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Think I'll never be able to do it", da: "Tror aldrig jeg kan lære det", sv: "Tror att jag aldrig kommer kunna göra det", de: "Denke ich werde es nie können", ar: "أعتقد أنني لن أستطيع أبدًا فعلها" } },
      { value: 2, label: { en: "Try once or twice but give up if it's hard", da: "Prøver en eller to gange, men giver op hvis det er svært", sv: "Provar en eller två gånger men ger upp om det är svårt", de: "Versuche es ein oder zweimal, gebe aber auf wenn es schwer ist", ar: "أحاول مرة أو مرتين لكنني أستسلم إذا كان صعبًا" } },
      { value: 3, label: { en: "Practice it but feel a bit unsure", da: "Øver det, men føler mig lidt usikker", sv: "Övar det men känner mig lite osäker", de: "Übe es, fühle mich aber etwas unsicher", ar: "أتدرب عليها لكنني أشعر ببعض عدم اليقين" } },
      { value: 4, label: { en: "Keep practicing until I get it right", da: "Bliver ved med at øve til jeg kan det", sv: "Fortsätter öva tills jag kan det", de: "Übe weiter bis ich es kann", ar: "أستمر في التدريب حتى أتقنها" } },
      { value: 5, label: { en: "Love learning new things — it's the best part!", da: "Elsker at lære nye ting — det er det bedste!", sv: "Älskar att lära mig nya saker — det är det bästa!", de: "Liebe es Neues zu lernen — das ist das Beste!", ar: "أحب تعلم أشياء جديدة — هذا أفضل جزء!" } },
    ],
  },
  // Motivation
  {
    id: "mo1",
    category: "motivation",
    text: {
      en: "How much do I want to go to taekwondo training?",
      da: "Hvor meget har jeg lyst til at tage til taekwondo-træning?",
      sv: "Hur mycket vill jag gå på taekwondoträning?",
      de: "Wie sehr möchte ich zum Taekwondo-Training gehen?",
      ar: "كم أرغب في الذهاب لتدريب التايكوندو؟"
    },
    options: [
      { value: 1, label: { en: "I often don't want to go", da: "Jeg har ofte ikke lyst til at tage afsted", sv: "Jag vill ofta inte gå", de: "Ich möchte oft nicht hingehen", ar: "غالبًا لا أريد الذهاب" } },
      { value: 2, label: { en: "Sometimes I want to, sometimes not", da: "Nogle gange har jeg lyst, andre gange ikke", sv: "Ibland vill jag, ibland inte", de: "Manchmal möchte ich, manchmal nicht", ar: "أحيانًا أريد، وأحيانًا لا" } },
      { value: 3, label: { en: "Usually I want to go", da: "Normalt har jeg lyst til at tage afsted", sv: "Vanligtvis vill jag gå", de: "Normalerweise möchte ich gehen", ar: "عادة أريد الذهاب" } },
      { value: 4, label: { en: "I almost always look forward to training", da: "Jeg glæder mig næsten altid til træning", sv: "Jag ser nästan alltid fram emot träning", de: "Ich freue mich fast immer auf das Training", ar: "أتطلع دائمًا تقريبًا للتدريب" } },
      { value: 5, label: { en: "I LOVE training — I can't wait for every session!", da: "Jeg ELSKER at træne — jeg kan ikke vente til hver session!", sv: "Jag ÄLSKAR att träna — jag kan inte vänta på varje pass!", de: "Ich LIEBE Training — ich kann es kaum erwarten!", ar: "أحب التدريب — لا أستطيع الانتظار لكل جلسة!" } },
    ],
  },
  {
    id: "mo2",
    category: "motivation",
    text: {
      en: "When training is boring or feels the same every time, I...",
      da: "Når træningen er kedelig eller føles ens hver gang, så...",
      sv: "När träningen är tråkig eller känns likadan varje gång, så...",
      de: "Wenn das Training langweilig ist oder sich jedes Mal gleich anfühlt, dann...",
      ar: "عندما يكون التدريب مملًا أو يبدو نفسه كل مرة، أنا..."
    },
    options: [
      { value: 1, label: { en: "Don't want to come anymore", da: "Har ikke lyst til at komme mere", sv: "Vill inte komma mer", de: "Möchte nicht mehr kommen", ar: "لا أريد الحضور بعد الآن" } },
      { value: 2, label: { en: "Zone out and don't try very hard", da: "Melder mig ud og prøver ikke særlig hårdt", sv: "Zonar ut och försöker inte så hårt", de: "Schalte ab und gebe mir nicht viel Mühe", ar: "أنفصل ذهنيًا ولا أحاول بجد" } },
      { value: 3, label: { en: "Still show up but feel a bit bored", da: "Dukker stadig op, men keder mig lidt", sv: "Dyker fortfarande upp men är lite uttråkad", de: "Komme trotzdem, bin aber etwas gelangweilt", ar: "أحضر لكنني أشعر بالملل قليلًا" } },
      { value: 4, label: { en: "Try to make it fun for myself anyway", da: "Prøver at gøre det sjovt for mig selv alligevel", sv: "Försöker göra det kul för mig själv ändå", de: "Versuche es trotzdem für mich spaßig zu machen", ar: "أحاول جعله ممتعًا لنفسي على أي حال" } },
      { value: 5, label: { en: "Find new challenges even in boring drills", da: "Finder nye udfordringer selv i kedelige øvelser", sv: "Hittar nya utmaningar även i tråkiga övningar", de: "Finde neue Herausforderungen auch in langweiligen Übungen", ar: "أجد تحديات جديدة حتى في التمارين المملة" } },
    ],
  },
  {
    id: "mo3",
    category: "motivation",
    text: {
      en: "When other kids at the club learn things faster than me, I...",
      da: "Når andre børn i klubben lærer ting hurtigere end mig, så...",
      sv: "När andra barn i klubben lär sig saker snabbare än mig, så...",
      de: "Wenn andere Kinder im Verein schneller lernen als ich, dann...",
      ar: "عندما يتعلم أطفال آخرون في النادي أسرع مني، أنا..."
    },
    options: [
      { value: 1, label: { en: "Think I'm bad at taekwondo and want to quit", da: "Tror jeg er dårlig til taekwondo og vil stoppe", sv: "Tror att jag är dålig på taekwondo och vill sluta", de: "Denke ich bin schlecht im Taekwondo und möchte aufhören", ar: "أعتقد أنني سيئ في التايكوندو وأريد التوقف" } },
      { value: 2, label: { en: "Feel sad and jealous", da: "Bliver ked af det og misundelig", sv: "Blir ledsen och avundsjuk", de: "Bin traurig und eifersüchtig", ar: "أشعر بالحزن والغيرة" } },
      { value: 3, label: { en: "Feel a bit left behind but keep trying", da: "Føler mig lidt bagud, men fortsætter med at prøve", sv: "Känner mig lite efter men fortsätter försöka", de: "Fühle mich etwas zurückgelassen, versuche aber weiter", ar: "أشعر بالتأخر قليلًا لكنني أستمر في المحاولة" } },
      { value: 4, label: { en: "Know that everyone learns at their own speed", da: "Ved at alle lærer i deres eget tempo", sv: "Vet att alla lär sig i sin egen takt", de: "Weiß dass jeder in seinem eigenen Tempo lernt", ar: "أعلم أن الجميع يتعلمون بسرعتهم الخاصة" } },
      { value: 5, label: { en: "Feel happy for them and work extra hard", da: "Er glad for dem og arbejder ekstra hårdt", sv: "Är glad för dem och jobbar extra hårt", de: "Bin froh für sie und arbeite extra hart", ar: "أكون سعيدًا لأجلهم وأعمل بجد أكثر" } },
    ],
  },
  {
    id: "mo4",
    category: "motivation",
    text: {
      en: "Do I have goals for my taekwondo?",
      da: "Har jeg mål for min taekwondo?",
      sv: "Har jag mål för min taekwondo?",
      de: "Habe ich Ziele für mein Taekwondo?",
      ar: "هل لدي أهداف في التايكوندو؟"
    },
    options: [
      { value: 1, label: { en: "Not really, I just go because my parents say so", da: "Ikke rigtig, jeg går bare fordi mine forældre siger det", sv: "Inte riktigt, jag går bara för att mina föräldrar säger det", de: "Nicht wirklich, ich gehe nur weil meine Eltern es sagen", ar: "ليس حقًا، أذهب فقط لأن والدي يقولون ذلك" } },
      { value: 2, label: { en: "Kind of, but I don't think about them much", da: "Lidt, men jeg tænker ikke så meget over dem", sv: "Lite, men jag tänker inte så mycket på dem", de: "Ein bisschen, aber ich denke nicht viel darüber nach", ar: "نوعًا ما، لكنني لا أفكر فيها كثيرًا" } },
      { value: 3, label: { en: "Yes, I want to get the next belt", da: "Ja, jeg vil gerne have næste bælte", sv: "Ja, jag vill ta nästa bälte", de: "Ja, ich möchte den nächsten Gürtel bekommen", ar: "نعم، أريد الحصول على الحزام التالي" } },
      { value: 4, label: { en: "Yes, I have clear goals and I work towards them", da: "Ja, jeg har klare mål og arbejder hen imod dem", sv: "Ja, jag har tydliga mål och jobbar mot dem", de: "Ja, ich habe klare Ziele und arbeite darauf hin", ar: "نعم، لدي أهداف واضحة وأعمل نحوها" } },
      { value: 5, label: { en: "Yes! I dream big and train hard to get there!", da: "Ja! Jeg drømmer stort og træner hårdt for at nå dertil!", sv: "Ja! Jag drömmer stort och tränar hårt för att nå dit!", de: "Ja! Ich träume groß und trainiere hart um es zu schaffen!", ar: "نعم! أحلم بالكبير وأتدرب بجد للوصول!" } },
    ],
  },
  // Fatigue & Motivation
  {
    id: "fm1",
    category: "fatigueMotivation",
    text: {
      en: "How tired does your body feel today?",
      da: "Hvor træt føles din krop i dag?",
      sv: "Hur trött känns din kropp idag?",
      de: "Wie müde fühlt sich dein Körper heute an?",
      ar: "كم يشعر جسمك بالتعب اليوم؟"
    },
    options: [
      { value: 1, label: { en: "Super tired — I can barely move", da: "Super træt — jeg kan næsten ikke bevæge mig", sv: "Superledd — jag kan knappt röra mig", de: "Super müde — ich kann mich kaum bewegen", ar: "متعب جداً — بالكاد أستطيع الحركة" } },
      { value: 2, label: { en: "Pretty tired — my legs feel heavy", da: "Ret træt — mine ben føles tunge", sv: "Ganska trött — mina ben känns tunga", de: "Ziemlich müde — meine Beine fühlen sich schwer an", ar: "متعب نسبياً — ساقاي تشعران بثقل" } },
      { value: 3, label: { en: "A little tired but I can still train", da: "Lidt træt, men kan stadig træne", sv: "Lite trött men kan fortfarande träna", de: "Ein wenig müde aber ich kann noch trainieren", ar: "متعب قليلاً لكنني أستطيع التدريب" } },
      { value: 4, label: { en: "Good — I have lots of energy!", da: "God — jeg har masser af energi!", sv: "Bra — jag har massor av energi!", de: "Gut — ich habe viel Energie!", ar: "بخير — لدي الكثير من الطاقة!" } },
      { value: 5, label: { en: "Amazing — I feel like I can do anything!", da: "Fantastisk — jeg føler jeg kan gøre alt!", sv: "Fantastisk — jag känner att jag kan göra vad som helst!", de: "Fantastisch — ich fühle ich kann alles tun!", ar: "رائع — أشعر أنني أستطيع فعل أي شيء!" } },
    ],
  },
  {
    id: "fm2",
    category: "fatigueMotivation",
    text: {
      en: "Do you feel like going to taekwondo training today?",
      da: "Har du lyst til at tage til taekwondo-træning i dag?",
      sv: "Vill du gå på taekwondoträning idag?",
      de: "Hast du Lust heute zum Taekwondo-Training zu gehen?",
      ar: "هل تشعر بالرغبة في الذهاب لتدريب التايكوندو اليوم؟"
    },
    options: [
      { value: 1, label: { en: "No, I really don't want to go", da: "Nej, jeg har virkelig ikke lyst til at tage afsted", sv: "Nej, jag vill verkligen inte gå", de: "Nein, ich möchte wirklich nicht gehen", ar: "لا، لا أريد الذهاب حقًا" } },
      { value: 2, label: { en: "Not really, but I'll go anyway", da: "Ikke rigtig, men jeg tager afsted alligevel", sv: "Inte riktigt, men jag går ändå", de: "Nicht wirklich, aber ich gehe trotzdem", ar: "ليس حقًا، لكنني سأذهب على أي حال" } },
      { value: 3, label: { en: "Kind of — I feel okay about it", da: "Lidt — det er okay", sv: "Lite — det känns okej", de: "Ein bisschen — ich fühle mich okay dabei", ar: "نوعًا ما — أشعر بأنه مقبول" } },
      { value: 4, label: { en: "Yes, I'm looking forward to it!", da: "Ja, jeg glæder mig!", sv: "Ja, jag ser fram emot det!", de: "Ja, ich freue mich darauf!", ar: "نعم، أتطلع إليه!" } },
      { value: 5, label: { en: "YES! I love taekwondo and I can't wait!", da: "JA! Jeg elsker taekwondo og kan ikke vente!", sv: "JA! Jag älskar taekwondo och kan inte vänta!", de: "JA! Ich liebe Taekwondo und kann es kaum erwarten!", ar: "نعم! أحب التايكوندو ولا أستطيع الانتظار!" } },
    ],
  },
  {
    id: "fm3",
    category: "fatigueMotivation",
    text: {
      en: "How well did you sleep last night?",
      da: "Hvor godt sov du i nat?",
      sv: "Hur bra sov du i natt?",
      de: "Wie gut hast du letzte Nacht geschlafen?",
      ar: "كيف كان نومك الليلة الماضية؟"
    },
    options: [
      { value: 1, label: { en: "Really badly — I'm very tired today", da: "Rigtig dårligt — jeg er meget træt i dag", sv: "Riktigt dåligt — jag är väldigt trött idag", de: "Richtig schlecht — ich bin heute sehr müde", ar: "بشكل سيئ جداً — أنا متعب جداً اليوم" } },
      { value: 2, label: { en: "Not so great — I woke up a lot", da: "Ikke så godt — jeg vågnede mange gange", sv: "Inte så bra — jag vaknade mycket", de: "Nicht so gut — ich bin oft aufgewacht", ar: "ليس جيدًا — استيقظت كثيرًا" } },
      { value: 3, label: { en: "Okay I guess", da: "Okay tror jeg", sv: "Okej antar jag", de: "Okay glaube ich", ar: "مقبول على ما أعتقد" } },
      { value: 4, label: { en: "Pretty good — I feel rested", da: "Ret godt — jeg føler mig udhvilet", sv: "Ganska bra — jag känner mig utvilad", de: "Ziemlich gut — ich fühle mich ausgeruht", ar: "جيد نسبياً — أشعر بالراحة" } },
      { value: 5, label: { en: "Amazing sleep — I feel super fresh!", da: "Fantastisk søvn — jeg er super frisk!", sv: "Fantastisk sömn — jag är superfräsch!", de: "Fantastischer Schlaf — ich bin super frisch!", ar: "نوم رائع — أشعر بانتعاش فائق!" } },
    ],
  },
  {
    id: "fm4",
    category: "fatigueMotivation",
    text: {
      en: "If you could skip training today with no consequences, would you?",
      da: "Hvis du kunne springe træning over i dag uden konsekvenser, ville du?",
      sv: "Om du kunde hoppa över träning idag utan konsekvenser, skulle du?",
      de: "Wenn du heute das Training ohne Konsequenzen überspringen könntest, würdest du?",
      ar: "إذا استطعت تخطي التدريب اليوم دون عواقب، هل ستفعل؟"
    },
    options: [
      { value: 1, label: { en: "Yes, definitely — I really don't want to train", da: "Ja, bestemt — jeg har virkelig ikke lyst til at træne", sv: "Ja definitivt — jag vill verkligen inte träna", de: "Ja definitiv — ich möchte wirklich nicht trainieren", ar: "نعم بالتأكيد — لا أريد التدريب حقًا" } },
      { value: 2, label: { en: "Probably yes", da: "Sandsynligvis ja", sv: "Troligtvis ja", de: "Wahrscheinlich ja", ar: "على الأرجح نعم" } },
      { value: 3, label: { en: "I'm not sure", da: "Jeg er ikke sikker", sv: "Jag är inte säker", de: "Ich bin nicht sicher", ar: "لست متأكدًا" } },
      { value: 4, label: { en: "No, I want to train!", da: "Nej, jeg vil gerne træne!", sv: "Nej, jag vill träna!", de: "Nein, ich möchte trainieren!", ar: "لا، أريد التدريب!" } },
      { value: 5, label: { en: "No way! Training is the best part of my day!", da: "Nej da! Træning er det bedste ved min dag!", sv: "Inte alls! Träning är det bästa med min dag!", de: "Auf keinen Fall! Training ist der beste Teil meines Tages!", ar: "لا أبدًا! التدريب هو أفضل جزء في يومي!" } },
    ],
  },
];

/** Age threshold for junior vs adult questions */
export const JUNIOR_AGE_THRESHOLD = 15;

/** Get the right question set based on athlete age */
export function getQuestionsForAge(age: number | null | undefined): MentalQuestion[] {
  if (age != null && age < JUNIOR_AGE_THRESHOLD) {
    return juniorQuestions;
  }
  return adultQuestions;
}
