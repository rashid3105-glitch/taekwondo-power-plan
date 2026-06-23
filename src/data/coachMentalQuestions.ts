// Coach-specific mental review questions.
// 6 categories × 5 questions = 30 items. The 6 categories MIRROR the athlete's
// 6 mental dimensions but are rewritten from a coaching / leadership perspective.
// Same 1–5 scoring scale (1 = unhealthy response, 5 = strong/healthy response)
// so the assessment UI can reuse the average-per-category logic.
// Total score = sum of 6 category averages (max 5 each) → "out of 30".


export interface CoachLangText {
  en: string;
  da: string;
  sv: string;
  de: string;
  ar: string;
  no: string;
  es: string;
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
  // ===== composureUnderPressure (mirrors athlete mentalToughness) =====
  {
    id: "cup1",
    category: "composureUnderPressure",
    text: {
      en: "When my team is behind in an important match, I…",
      da: "Når mit hold er bagud i en vigtig kamp, så…",
      sv: "När mitt lag ligger under i en viktig match, så…",
      de: "Wenn mein Team in einem wichtigen Wettkampf zurückliegt, dann…",
      ar: "عندما يكون فريقي متأخرًا في مباراة مهمة، أنا…",
      no: "Når laget mitt ligger under i en viktig kamp, så…",
      es: "Cuando mi equipo va perdiendo en un combate importante, yo…",
    },
    options: opts(
      { en: "Lose my head and start shouting instructions", da: "Mister hovedet og råber instrukser", sv: "Tappar huvudet och börjar skrika instruktioner", de: "Verliere den Kopf und schreie Anweisungen", ar: "أفقد أعصابي وأبدأ بالصراخ بالتعليمات", no: "Mister hodet og roper instruksjoner", es: "Pierdo la cabeza y empiezo a gritar instrucciones" },
      { en: "Get visibly tense — the athlete can feel it from the corner", da: "Bliver tydeligt anspændt — atleten kan mærke det fra hjørnet", sv: "Blir tydligt spänd — atleten känner det från hörnet", de: "Werde sichtbar angespannt — der Athlet spürt es aus der Ecke", ar: "أتوتر بشكل واضح — يشعر اللاعب بذلك من الزاوية", no: "Blir tydelig anspent — utøveren merker det fra hjørnet", es: "Me tenso de forma visible — el atleta lo nota desde la esquina" },
      { en: "Stay outwardly calm but my mind races", da: "Forbliver rolig udadtil, men mine tanker kører", sv: "Förblir lugn utåt men tankarna rusar", de: "Bleibe äußerlich ruhig, aber meine Gedanken rasen", ar: "أبقى هادئًا ظاهريًا لكن أفكاري متسارعة", no: "Forblir rolig utad, men tankene raser", es: "Me mantengo calmado por fuera, pero mi mente va a mil" },
      { en: "Steady my voice and give one clear adjustment", da: "Holder stemmen rolig og giver én klar justering", sv: "Håller rösten stadig och ger en tydlig justering", de: "Halte die Stimme ruhig und gebe eine klare Anweisung", ar: "أُثبّت صوتي وأعطي تعديلًا واحدًا واضحًا", no: "Holder stemmen stødig og gir én tydelig justering", es: "Mantengo la voz firme y doy un ajuste claro" },
      { en: "Get sharper — pressure brings out my best coaching", da: "Bliver skarpere — pres får mit bedste coaching frem", sv: "Blir skarpare — pressen tar fram min bästa coaching", de: "Werde schärfer — Druck holt mein bestes Coaching hervor", ar: "أصبح أكثر حدة — الضغط يُخرج أفضل ما عندي كمدرب", no: "Blir skarpere — press henter fram min beste coaching", es: "Me vuelvo más agudo — la presión saca mi mejor versión" },
    ),
  },
  {
    id: "cup2",
    category: "composureUnderPressure",
    text: {
      en: "A long tournament day is draining me. By the last fight I am…",
      da: "En lang stævnedag tærer på mig. Ved sidste kamp er jeg…",
      sv: "En lång tävlingsdag sliter på mig. Vid sista matchen är jag…",
      de: "Ein langer Turniertag zehrt an mir. Beim letzten Kampf bin ich…",
      ar: "يوم بطولة طويل يستنزفني. عند المباراة الأخيرة أكون…",
      no: "En lang turneringsdag tærer på meg. Ved siste kamp er jeg…",
      es: "Un día largo de competición me agota. En el último combate estoy…",
    },
    options: opts(
      { en: "Empty — I can barely give cues", da: "Tom — jeg kan næsten ikke give cues", sv: "Helt slut — orkar knappt ge cues", de: "Leer — ich kann kaum noch coachen", ar: "فارغ — بالكاد أستطيع توجيه اللاعبين", no: "Tom — jeg klarer knapt å gi cues", es: "Vacío — apenas puedo dar indicaciones" },
      { en: "Short-tempered and impatient", da: "Kort for hovedet og utålmodig", sv: "Kort i tonen och otålig", de: "Gereizt und ungeduldig", ar: "نافد الصبر وسريع الانفعال", no: "Kort i toppen og utålmodig", es: "Irritable e impaciente" },
      { en: "Tired but still functional", da: "Træt men stadig fungerende", sv: "Trött men fortfarande funktionell", de: "Müde, aber noch funktional", ar: "متعب لكنني ما زلت قادرًا", no: "Sliten, men fungerer fortsatt", es: "Cansado pero todavía funcional" },
      { en: "Pacing myself well — I save energy for the corner", da: "Doserer mig selv godt — jeg sparer energi til hjørnet", sv: "Doserar mig själv väl — sparar energi till hörnet", de: "Teile mir die Kräfte gut ein — Energie für die Ecke", ar: "أوزّع طاقتي جيدًا — أحتفظ بها للزاوية", no: "Doserer meg godt — sparer energi til hjørnet", es: "Dosifico bien mi energía — la guardo para la esquina" },
      { en: "Locked in — the late fights are where I'm sharpest", da: "Fuldt fokuseret — de sene kampe er hvor jeg er skarpest", sv: "Helt fokuserad — de sena matcherna är där jag är skarpast", de: "Voll fokussiert — die späten Kämpfe sind meine besten", ar: "في كامل تركيزي — المباريات المتأخرة هي الأفضل لي", no: "Full fokus — de sene kampene er der jeg er skarpest", es: "Totalmente concentrado — los últimos combates son donde mejor estoy" },
    ),
  },
  {
    id: "cup3",
    category: "composureUnderPressure",
    text: {
      en: "When a referee call goes against my athlete in a decisive moment, I…",
      da: "Når en dommerkendelse går imod min atlet i et afgørende øjeblik, så…",
      sv: "När ett domarbeslut går emot min atlet i ett avgörande ögonblick, så…",
      de: "Wenn eine Kampfrichter-Entscheidung in einem entscheidenden Moment gegen meinen Athleten geht, dann…",
      ar: "عندما يصدر قرار حكم ضد لاعبي في لحظة حاسمة، أنا…",
      no: "Når en dommeravgjørelse går mot utøveren min i et avgjørende øyeblikk, så…",
      es: "Cuando una decisión arbitral va en contra de mi atleta en un momento decisivo, yo…",
    },
    options: opts(
      { en: "Explode — yell at the referee", da: "Eksploderer — råber af dommeren", sv: "Exploderar — skriker åt domaren", de: "Explodiere — schreie den Kampfrichter an", ar: "أنفجر — أصرخ في وجه الحكم", no: "Eksploderer — roper til dommeren", es: "Exploto — le grito al árbitro" },
      { en: "Mutter loud enough that my athlete hears it", da: "Brokker mig højt nok til at min atlet hører det", sv: "Muttrar högt nog för att min atlet hör det", de: "Schimpfe so laut, dass mein Athlet es hört", ar: "أتذمر بصوت يسمعه لاعبي", no: "Murrer høyt nok til at utøveren hører det", es: "Murmuro lo bastante alto para que mi atleta lo oiga" },
      { en: "Bottle it but lose focus for the next exchange", da: "Holder det inde, men mister fokus i næste udveksling", sv: "Håller in det men tappar fokus inför nästa utbyte", de: "Schlucke es runter, verliere aber den Fokus für den nächsten Austausch", ar: "أكتم غضبي لكني أفقد التركيز في التبادل التالي", no: "Holder det inne, men mister fokus i neste utveksling", es: "Me lo trago pero pierdo el foco en el siguiente intercambio" },
      { en: "Reset, refocus on the next 10 seconds", da: "Nulstiller og fokuserer på de næste 10 sekunder", sv: "Nollställer och fokuserar på nästa 10 sekunder", de: "Setze zurück, fokussiere die nächsten 10 Sekunden", ar: "أعيد ضبط نفسي وأركّز على الـ10 ثوانٍ التالية", no: "Nullstiller og fokuserer på de neste 10 sekundene", es: "Me reseteo y me concentro en los próximos 10 segundos" },
      { en: "Use it — channel the injustice into a calm, sharp game plan", da: "Bruger det — kanaliserer uretfærdigheden til en rolig, skarp plan", sv: "Använder det — kanaliserar orättvisan till en lugn, vass plan", de: "Nutze es — kanalisiere die Ungerechtigkeit in einen ruhigen, klaren Plan", ar: "أستثمر ذلك — أحوّل الظلم إلى خطة هادئة وحادة", no: "Bruker det — kanaliserer urettferdigheten til en rolig, skarp plan", es: "Lo aprovecho — canalizo la injusticia en un plan claro y tranquilo" },
    ),
  },

  // ===== sidelineCalm (mirrors athlete competitionAnxiety) =====
  {
    id: "sc1",
    category: "sidelineCalm",
    text: {
      en: "When the pressure is at its highest in a fight, in the corner I feel…",
      da: "Når presset er størst i en kamp, mærker jeg i hjørnet…",
      sv: "När pressen är som störst i en match känner jag i hörnet…",
      de: "Wenn der Druck im Kampf am höchsten ist, fühle ich in der Ecke…",
      ar: "عندما يبلغ الضغط ذروته في المباراة، أشعر في الزاوية…",
      no: "Når presset er størst i en kamp, kjenner jeg i hjørnet…",
      es: "Cuando la presión está al máximo en un combate, en la esquina siento…",
    },
    options: opts(
      { en: "Panic — my voice shakes and I forget the plan", da: "Panik — min stemme ryster og jeg glemmer planen", sv: "Panik — rösten skakar och jag glömmer planen", de: "Panik — meine Stimme zittert und ich vergesse den Plan", ar: "هلع — صوتي يرتجف وأنسى الخطة", no: "Panikk — stemmen skjelver og jeg glemmer planen", es: "Pánico — me tiembla la voz y olvido el plan" },
      { en: "Heart racing, mouth dry, hard to think clearly", da: "Hjertet hamrer, tør mund, svært at tænke klart", sv: "Hjärtat rusar, torr mun, svårt att tänka klart", de: "Herz rast, trockener Mund, schwer klar zu denken", ar: "قلبي يخفق وفمي جاف، يصعب التفكير بوضوح", no: "Hjertet hamrer, tørr munn, vanskelig å tenke klart", es: "Corazón acelerado, boca seca, me cuesta pensar con claridad" },
      { en: "Tense but I can still give one cue", da: "Anspændt, men kan stadig give ét cue", sv: "Spänd men kan ge ett cue", de: "Angespannt, kann aber noch einen Cue geben", ar: "متوتر لكنني أستطيع إعطاء توجيه واحد", no: "Anspent, men klarer å gi ett cue", es: "Tenso pero aún puedo dar una indicación" },
      { en: "Nervous energy that I channel into focus", da: "Nervøs energi som jeg kanaliserer til fokus", sv: "Nervös energi som jag kanaliserar till fokus", de: "Nervöse Energie, die ich in Fokus umwandle", ar: "طاقة عصبية أحوّلها إلى تركيز", no: "Nervøs energi som jeg kanaliserer til fokus", es: "Energía nerviosa que canalizo en concentración" },
      { en: "Calm, clear and present — this is where I belong", da: "Rolig, klar og nærværende — det er her, jeg hører til", sv: "Lugn, klar och närvarande — det är här jag hör hemma", de: "Ruhig, klar und präsent — hier gehöre ich hin", ar: "هادئ، صافٍ، حاضر — هنا أنتمي", no: "Rolig, klar og til stede — det er her jeg hører til", es: "Tranquilo, claro y presente — aquí es donde pertenezco" },
    ),
  },
  {
    id: "sc2",
    category: "sidelineCalm",
    text: {
      en: "The morning of an important competition, my body feels…",
      da: "Om morgenen før en vigtig konkurrence føles min krop…",
      sv: "Morgonen före en viktig tävling känns kroppen…",
      de: "Am Morgen eines wichtigen Wettkampfs fühlt sich mein Körper an wie…",
      ar: "في صباح يوم منافسة مهمة، أشعر بجسدي…",
      no: "Morgenen før en viktig konkurranse kjennes kroppen…",
      es: "La mañana de una competición importante, mi cuerpo se siente…",
    },
    options: opts(
      { en: "Heavy, nauseous — I dread the day", da: "Tung, kvalmende — jeg frygter dagen", sv: "Tung, illamående — jag bävar för dagen", de: "Schwer, übel — ich fürchte den Tag", ar: "ثقيل، أشعر بالغثيان — أخشى اليوم", no: "Tung, kvalm — jeg gruer meg til dagen", es: "Pesado, con náuseas — temo el día" },
      { en: "Wired and shaky, struggling to eat", da: "Skarp og rystende, svært ved at spise", sv: "Spänd och skakig, svårt att äta", de: "Aufgedreht und zittrig, kann kaum essen", ar: "متوتر ومرتجف، أعاني في الأكل", no: "Spent og skjelven, sliter med å spise", es: "Tenso y tembloroso, me cuesta comer" },
      { en: "Restless but manageable", da: "Rastløs men håndterbart", sv: "Rastlös men hanterbart", de: "Unruhig, aber zu bewältigen", ar: "قلق لكن يمكن التعامل معه", no: "Urolig, men håndterbart", es: "Inquieto pero manejable" },
      { en: "Alert and ready — my routine kicks in", da: "Vågen og klar — min rutine starter", sv: "Alert och redo — min rutin startar", de: "Wach und bereit — meine Routine greift", ar: "متيقظ وجاهز — يبدأ روتيني", no: "Våken og klar — rutinen min slår inn", es: "Alerta y listo — mi rutina entra en marcha" },
      { en: "Calm, energised, looking forward to it", da: "Rolig, energifyldt, glæder mig", sv: "Lugn, energifylld, ser fram emot det", de: "Ruhig, energiegeladen, freue mich darauf", ar: "هادئ، مفعم بالطاقة، أتطلع لذلك", no: "Rolig, energisk, gleder meg", es: "Tranquilo, con energía, con ganas" },
    ),
  },
  {
    id: "sc3",
    category: "sidelineCalm",
    text: {
      en: "The night before a major event for my athletes, my sleep is…",
      da: "Natten før et stort stævne for mine atleter er min søvn…",
      sv: "Natten före ett stort event för mina atleter är min sömn…",
      de: "Die Nacht vor einem großen Event für meine Athleten ist mein Schlaf…",
      ar: "في الليلة السابقة لحدث كبير للاعبيّ، نومي…",
      no: "Natten før et stort stevne for utøverne mine er søvnen min…",
      es: "La noche antes de un evento grande para mis atletas, mi sueño es…",
    },
    options: opts(
      { en: "Awful — I lie awake replaying scenarios", da: "Forfærdelig — jeg ligger vågen og spiller scenarier af", sv: "Förfärlig — jag ligger vaken och spelar upp scenarier", de: "Furchtbar — ich liege wach und spiele Szenarien durch", ar: "سيء جدًا — أبقى مستيقظًا أتخيل السيناريوهات", no: "Forferdelig — ligger våken og spiller av scenarier", es: "Pésimo — me quedo despierto repasando escenarios" },
      { en: "Broken — I wake up several times", da: "Brudt — jeg vågner flere gange", sv: "Avbruten — jag vaknar flera gånger", de: "Unterbrochen — ich wache mehrmals auf", ar: "متقطّع — أستيقظ عدة مرات", no: "Avbrutt — jeg våkner flere ganger", es: "Interrumpido — me despierto varias veces" },
      { en: "Okay, takes a while to fall asleep", da: "Okay, tager tid at falde i søvn", sv: "Okej, tar ett tag att somna", de: "Okay, brauche länger zum Einschlafen", ar: "مقبول، أستغرق وقتًا للنوم", no: "Greit, tar tid å sovne", es: "Aceptable, tardo en dormirme" },
      { en: "Solid — I have a pre-comp routine that works", da: "Solid — jeg har en før-stævne-rutine der virker", sv: "Stabil — jag har en rutin före tävlingen som funkar", de: "Solide — ich habe eine Pre-Comp-Routine die funktioniert", ar: "جيد — لدي روتين قبل البطولة يعمل", no: "Solid — har en før-konkurranse-rutine som funker", es: "Sólido — tengo una rutina previa que funciona" },
      { en: "Deep — I trust the preparation and let go", da: "Dyb — jeg stoler på forberedelsen og slipper", sv: "Djup — jag litar på förberedelsen och släpper taget", de: "Tief — ich vertraue der Vorbereitung und lasse los", ar: "عميق — أثق بالإعداد وأترك الأمر", no: "Dyp — jeg stoler på forberedelsen og slipper taket", es: "Profundo — confío en la preparación y suelto" },
    ),
  },

  // ===== decisionMakingUnderChaos (mirrors athlete focusConcentration) =====
  {
    id: "dm1",
    category: "decisionMakingUnderChaos",
    text: {
      en: "In the middle of a chaotic exchange I can read the situation and…",
      da: "Midt i en hektisk udveksling kan jeg læse situationen og…",
      sv: "Mitt i ett kaotiskt utbyte kan jag läsa situationen och…",
      de: "Mitten in einem chaotischen Schlagabtausch kann ich die Situation lesen und…",
      ar: "في خضم تبادل فوضوي، أستطيع قراءة الموقف و…",
      no: "Midt i en kaotisk utveksling kan jeg lese situasjonen og…",
      es: "En medio de un intercambio caótico puedo leer la situación y…",
    },
    options: opts(
      { en: "Freeze — I shout something generic", da: "Fryser — jeg råber noget generisk", sv: "Fryser — jag skriker något generiskt", de: "Erstarre — ich rufe etwas Allgemeines", ar: "أتجمد — أصرخ بشيء عام", no: "Fryser — roper noe generisk", es: "Me bloqueo — grito algo genérico" },
      { en: "Give too many instructions at once", da: "Giver for mange instrukser på én gang", sv: "Ger för många instruktioner samtidigt", de: "Gebe zu viele Anweisungen gleichzeitig", ar: "أعطي تعليمات كثيرة دفعة واحدة", no: "Gir for mange instruksjoner på én gang", es: "Doy demasiadas instrucciones a la vez" },
      { en: "See the pattern after the round, not during", da: "Ser mønstret efter rundens slut, ikke under", sv: "Ser mönstret efter ronden, inte under", de: "Erkenne das Muster nach der Runde, nicht währenddessen", ar: "أرى النمط بعد الجولة، لا خلالها", no: "Ser mønsteret etter runden, ikke under", es: "Veo el patrón después del round, no durante" },
      { en: "Pick ONE clear adjustment and call it", da: "Vælger ÉN klar justering og kalder den", sv: "Väljer EN tydlig justering och ropar den", de: "Wähle EINE klare Anpassung und rufe sie", ar: "أختار تعديلًا واحدًا واضحًا وأقوله", no: "Velger ÉN tydelig justering og roper den", es: "Elijo UN ajuste claro y lo digo" },
      { en: "Read the opponent in real time and dictate the fight", da: "Læser modstanderen i realtid og dikterer kampen", sv: "Läser motståndaren i realtid och dikterar matchen", de: "Lese den Gegner in Echtzeit und diktiere den Kampf", ar: "أقرأ الخصم لحظيًا وأتحكّم بالمباراة", no: "Leser motstanderen i sanntid og dikterer kampen", es: "Leo al rival en tiempo real y dicto el combate" },
    ),
  },
  {
    id: "dm2",
    category: "decisionMakingUnderChaos",
    text: {
      en: "When the crowd is loud and the bracket is running late, my focus is…",
      da: "Når publikum er højlydt og puljen er forsinket, er mit fokus…",
      sv: "När publiken är högljudd och poolen är försenad är mitt fokus…",
      de: "Wenn das Publikum laut ist und der Pool im Verzug, ist mein Fokus…",
      ar: "عندما يكون الجمهور صاخبًا والمسابقة متأخرة، يكون تركيزي…",
      no: "Når publikum er høylytt og puljen ligger bak skjema, er fokuset mitt…",
      es: "Cuando el público está ruidoso y el cuadro va con retraso, mi foco está…",
    },
    options: opts(
      { en: "Scattered — I keep losing track of athletes", da: "Spredt — jeg mister overblikket over atleterne", sv: "Splittrad — tappar koll på atleterna", de: "Zerstreut — ich verliere den Überblick", ar: "مشتت — أفقد متابعة لاعبيّ", no: "Spredt — mister oversikten over utøverne", es: "Disperso — pierdo el rastro de mis atletas" },
      { en: "Pulled in by every drama on every mat", da: "Trækkes ind af hver drama på hver mat", sv: "Dras in i varje drama på varje matta", de: "Werde von jedem Drama auf jeder Matte gefangen", ar: "أنشغل بكل دراما على كل بساط", no: "Trekkes med av hvert drama på hver matte", es: "Me dejo arrastrar por cada drama en cada tatami" },
      { en: "Mostly on my athlete but with frequent drift", da: "For det meste på min atlet men driver tit væk", sv: "Mest på min atlet men driver iväg ofta", de: "Meist beim Athleten, schweife aber oft ab", ar: "غالبًا على لاعبي لكن أشرد كثيرًا", no: "For det meste på utøveren, men driver ofte vekk", es: "Sobre todo en mi atleta, pero me distraigo a menudo" },
      { en: "Tunnel-vision on the current fight, others on pause", da: "Tunnelfokus på den aktuelle kamp, andre på pause", sv: "Tunnelfokus på aktuell match, övriga på paus", de: "Tunnelblick auf den aktuellen Kampf, der Rest pausiert", ar: "تركيز نفقي على المباراة الحالية، الباقي مؤجَّل", no: "Tunnelfokus på kampen som går, resten på pause", es: "Visión de túnel en el combate actual, los demás en pausa" },
      { en: "Silent inside — the noise becomes background", da: "Stille indeni — støjen bliver baggrund", sv: "Tyst inombords — bruset blir bakgrund", de: "Innen still — der Lärm wird Hintergrund", ar: "هدوء داخلي — تتحول الضوضاء إلى خلفية", no: "Stille inni meg — lyden blir bakgrunn", es: "Silencio por dentro — el ruido se vuelve fondo" },
    ),
  },
  {
    id: "dm3",
    category: "decisionMakingUnderChaos",
    text: {
      en: "Between rounds, the feedback I give in 60 seconds is…",
      da: "Mellem runderne er min feedback på 60 sekunder…",
      sv: "Mellan ronderna är min feedback på 60 sekunder…",
      de: "Zwischen den Runden ist mein Feedback in 60 Sekunden…",
      ar: "بين الجولات، تكون ملاحظاتي خلال 60 ثانية…",
      no: "Mellom rundene er tilbakemeldingen min på 60 sekunder…",
      es: "Entre rounds, el feedback que doy en 60 segundos es…",
    },
    options: opts(
      { en: "Long, emotional, the athlete glazes over", da: "Lang, følelsesladet, atleten falder fra", sv: "Lång, känslosam, atleten checkar ut", de: "Lang, emotional, der Athlet schaltet ab", ar: "طويل وعاطفي، اللاعب يفقد التركيز", no: "Lang, følelsesladet, utøveren faller av", es: "Largo, emocional, el atleta se desconecta" },
      { en: "Three or four things at once", da: "Tre eller fire ting på én gang", sv: "Tre eller fyra saker samtidigt", de: "Drei oder vier Sachen gleichzeitig", ar: "ثلاثة أو أربعة أشياء معًا", no: "Tre eller fire ting på én gang", es: "Tres o cuatro cosas a la vez" },
      { en: "Two clear cues but they aren't always prioritised", da: "To klare cues men ikke altid prioriteret", sv: "Två tydliga cues men inte alltid prioriterade", de: "Zwei klare Cues, aber nicht immer priorisiert", ar: "إشارتان واضحتان لكن دون ترتيب أولويات", no: "To tydelige cues, men ikke alltid prioritert", es: "Dos indicaciones claras pero no siempre priorizadas" },
      { en: "One technical, one tactical cue — short and specific", da: "Én teknisk, én taktisk cue — kort og specifikt", sv: "En teknisk, en taktisk cue — kort och specifik", de: "Ein technischer, ein taktischer Cue — kurz und konkret", ar: "إشارة تقنية وأخرى تكتيكية — قصيرة ومحددة", no: "Én teknisk, én taktisk cue — kort og spesifikt", es: "Una indicación técnica, una táctica — corta y específica" },
      { en: "The one decisive cue that wins the next round", da: "Den ene afgørende cue der vinder næste runde", sv: "Den ena avgörande cue:n som vinner nästa rond", de: "Der eine entscheidende Cue, der die nächste Runde gewinnt", ar: "الإشارة الحاسمة الواحدة التي تكسب الجولة التالية", no: "Den ene avgjørende cue-en som vinner neste runde", es: "La indicación decisiva que gana el próximo round" },
    ),
  },

  // ===== roleModelAfterLoss (mirrors athlete recoveryFromLoss) =====
  {
    id: "rm1",
    category: "roleModelAfterLoss",
    text: {
      en: "After a loss for my team, the way I handle it is…",
      da: "Efter et nederlag for holdet håndterer jeg det ved at…",
      sv: "Efter en förlust för laget hanterar jag det genom att…",
      de: "Nach einer Niederlage für mein Team gehe ich damit um, indem ich…",
      ar: "بعد خسارة فريقي، أتعامل معها بأن…",
      no: "Etter et tap for laget håndterer jeg det ved å…",
      es: "Tras una derrota de mi equipo, lo manejo…",
    },
    options: opts(
      { en: "Blame athletes or referees and sulk for days", da: "Giver atleter eller dommere skylden og surmuler i dagevis", sv: "Skyller på atleter eller domare och surar i dagar", de: "Schiebe die Schuld auf Athleten oder Kampfrichter und schmolle tagelang", ar: "ألوم اللاعبين أو الحكام وأظل عابسًا لأيام", no: "Skylder på utøvere eller dommere og furter i dagevis", es: "Echo la culpa a atletas o árbitros y me enfurruño durante días" },
      { en: "Go quiet and distant — they can tell I'm upset", da: "Bliver stille og distanceret — de kan mærke jeg er ked af det", sv: "Blir tyst och distanserad — de märker att jag är ledsen", de: "Werde still und distanziert — sie merken, dass ich enttäuscht bin", ar: "أصبح صامتًا وبعيدًا — يلاحظون انزعاجي", no: "Blir stille og distansert — de merker at jeg er lei meg", es: "Me quedo callado y distante — notan que estoy molesto" },
      { en: "Stay professional but rehash it alone for too long", da: "Forbliver professionel men genoplever det alene for længe", sv: "Förblir professionell men maler på det själv för länge", de: "Bleibe professionell, kaue es aber zu lange allein durch", ar: "أبقى محترفًا لكني أجترّ الخسارة وحدي لوقت طويل", no: "Forblir profesjonell, men tygger på det alene for lenge", es: "Me mantengo profesional pero le doy demasiadas vueltas a solas" },
      { en: "Acknowledge it honestly, then move the group forward", da: "Anerkender det ærligt og fører gruppen videre", sv: "Bekräftar det ärligt och leder gruppen framåt", de: "Erkenne es ehrlich an und führe die Gruppe weiter", ar: "أعترف بصدق ثم أمضي بالمجموعة قدمًا", no: "Erkjenner det ærlig og leder gruppa videre", es: "Lo reconozco con honestidad y hago avanzar al grupo" },
      { en: "Model how to lose well — calm, curious, focused on learning", da: "Viser hvordan man taber godt — rolig, nysgerrig, fokuseret på læring", sv: "Visar hur man förlorar väl — lugn, nyfiken, lärfokuserad", de: "Zeige, wie man gut verliert — ruhig, neugierig, lernorientiert", ar: "أكون قدوة في الخسارة — هدوء وفضول وتركيز على التعلم", no: "Viser hvordan man taper godt — rolig, nysgjerrig, læringsfokusert", es: "Doy ejemplo de cómo perder bien — calmado, curioso, enfocado en aprender" },
    ),
  },
  {
    id: "rm2",
    category: "roleModelAfterLoss",
    text: {
      en: "The first conversation with an athlete after they lose is…",
      da: "Den første samtale med en atlet efter et nederlag er…",
      sv: "Det första samtalet med en atlet efter en förlust är…",
      de: "Das erste Gespräch mit einem Athleten nach einer Niederlage ist…",
      ar: "أول حوار مع لاعب بعد خسارته يكون…",
      no: "Den første samtalen med en utøver etter et tap er…",
      es: "La primera conversación con un atleta tras una derrota es…",
    },
    options: opts(
      { en: "A list of everything they did wrong", da: "En liste over alt det, de gjorde forkert", sv: "En lista över allt de gjorde fel", de: "Eine Liste aller Fehler", ar: "قائمة بكل ما أخطأوا فيه", no: "En liste over alt de gjorde feil", es: "Una lista de todo lo que hicieron mal" },
      { en: "Cold or transactional", da: "Kold eller transaktionel", sv: "Kall eller transaktionell", de: "Kalt oder sachlich", ar: "بارد أو روتيني", no: "Kald eller transaksjonell", es: "Fría o transaccional" },
      { en: "Polite but the athlete still leaves feeling small", da: "Høflig men atleten går derfra og føler sig lille", sv: "Artigt men atleten går därifrån och känner sig liten", de: "Höflich, aber der Athlet fühlt sich danach klein", ar: "مهذب لكن اللاعب يخرج وهو يشعر بأنه صغير", no: "Høflig, men utøveren går derfra og føler seg liten", es: "Educada pero el atleta se va sintiéndose pequeño" },
      { en: "Warm, short — 'sit with it, we'll review tomorrow'", da: "Varm, kort — 'sid med det, vi evaluerer i morgen'", sv: "Varm, kort — 'sitt med det, vi går igenom imorgon'", de: "Warm, kurz — 'lass es sacken, wir besprechen morgen'", ar: "دافئ ومختصر — 'تأمّل ما حصل، نراجع غدًا'", no: "Varm, kort — 'sitt med det, vi går gjennom i morgen'", es: "Cálida y breve — 'siéntalo, lo revisamos mañana'" },
      { en: "A safe space — they leave more confident than they came", da: "Et trygt rum — de går mere selvsikre, end de kom", sv: "Ett tryggt rum — de går mer självsäkra än de kom", de: "Ein sicherer Raum — sie gehen selbstsicherer als sie kamen", ar: "مساحة آمنة — يخرجون بثقة أكبر مما جاؤوا", no: "Et trygt rom — de går mer selvsikre enn de kom", es: "Un espacio seguro — se van con más confianza de la que llegaron" },
    ),
  },
  {
    id: "rm3",
    category: "roleModelAfterLoss",
    text: {
      en: "A week after a big team loss, my own internal story is…",
      da: "En uge efter et stort holdnederlag er min indre historie…",
      sv: "En vecka efter en stor lagförlust är min inre berättelse…",
      de: "Eine Woche nach einer großen Team-Niederlage ist meine innere Erzählung…",
      ar: "بعد أسبوع من خسارة كبيرة للفريق، حديثي الداخلي يكون…",
      no: "En uke etter et stort lagstap er min indre fortelling…",
      es: "Una semana después de una gran derrota del equipo, mi historia interna es…",
    },
    options: opts(
      { en: "'I'm not a good enough coach'", da: "'Jeg er ikke en god nok træner'", sv: "'Jag är inte en bra nog tränare'", de: "'Ich bin kein guter Trainer'", ar: "'لست مدربًا جيدًا بما يكفي'", no: "'Jeg er ikke en god nok trener'", es: "'No soy lo bastante buen entrenador'" },
      { en: "'I should have done more, I'm exhausted'", da: "'Jeg burde have gjort mere, jeg er udmattet'", sv: "'Jag borde ha gjort mer, jag är utmattad'", de: "'Ich hätte mehr tun müssen, ich bin erschöpft'", ar: "'كان عليّ فعل المزيد، أنا منهك'", no: "'Jeg burde ha gjort mer, jeg er utslitt'", es: "'Debí hacer más, estoy agotado'" },
      { en: "Mixed — some lessons, some self-doubt", da: "Blandet — nogle læringer, noget selvtvivl", sv: "Blandat — vissa lärdomar, viss självtvivel", de: "Gemischt — Lektionen und Selbstzweifel", ar: "مختلط — بعض الدروس وبعض الشك بالنفس", no: "Blandet — noen lærdommer, litt selvtvil", es: "Mixto — algunas lecciones, algo de duda" },
      { en: "Clear lessons logged, plan for next block", da: "Klare læringer noteret, plan for næste blok", sv: "Tydliga lärdomar antecknade, plan för nästa block", de: "Klare Lektionen notiert, Plan für nächsten Block", ar: "دروس واضحة موثقة وخطة للمرحلة القادمة", no: "Klare lærdommer notert, plan for neste blokk", es: "Lecciones claras anotadas, plan para el próximo bloque" },
      { en: "'Losses are data — I lead from a stronger place now'", da: "'Nederlag er data — jeg leder fra et stærkere sted nu'", sv: "'Förluster är data — jag leder från en starkare plats nu'", de: "'Niederlagen sind Daten — ich führe von einem stärkeren Platz aus'", ar: "'الخسائر بيانات — أقود الآن من موقع أقوى'", no: "'Tap er data — jeg leder fra et sterkere ståsted nå'", es: "'Las derrotas son datos — ahora lidero desde un lugar más fuerte'" },
    ),
  },

  // ===== coachConfidence (mirrors athlete confidence) =====
  {
    id: "cc1",
    category: "coachConfidence",
    text: {
      en: "When I make a tactical decision in the corner, I…",
      da: "Når jeg træffer en taktisk beslutning i hjørnet, så…",
      sv: "När jag fattar ett taktiskt beslut i hörnet, så…",
      de: "Wenn ich in der Ecke eine taktische Entscheidung treffe, dann…",
      ar: "عندما أتخذ قرارًا تكتيكيًا في الزاوية، أنا…",
      no: "Når jeg tar en taktisk avgjørelse i hjørnet, så…",
      es: "Cuando tomo una decisión táctica en la esquina, yo…",
    },
    options: opts(
      { en: "Second-guess myself every round", da: "Tvivler på mig selv hver runde", sv: "Ifrågasätter mig själv varje rond", de: "Zweifle in jeder Runde an mir", ar: "أشكك في نفسي كل جولة", no: "Tviler på meg selv hver runde", es: "Dudo de mí mismo en cada round" },
      { en: "Hedge — give vague cues so I can't be wrong", da: "Tager forbehold — giver vage cues så jeg ikke kan tage fejl", sv: "Hedgar — ger vaga cues så jag inte kan ha fel", de: "Sichere mich ab — vage Cues, damit ich nicht falsch liege", ar: "أتحفّظ — أعطي إشارات غامضة كي لا أكون مخطئًا", no: "Tar forbehold — gir vage cues så jeg ikke kan ta feil", es: "Me cubro — doy indicaciones vagas para no equivocarme" },
      { en: "Commit, but stew about it afterwards", da: "Forpligter mig, men grubler over det bagefter", sv: "Bestämmer mig, men ältar det efteråt", de: "Entscheide mich, hadere aber danach", ar: "أتخذ القرار لكنني أجترّه لاحقًا", no: "Bestemmer meg, men grubler i etterkant", es: "Me decido, pero le doy vueltas después" },
      { en: "Decide fast and own the call", da: "Beslutter hurtigt og står ved kaldet", sv: "Bestämmer snabbt och står för beslutet", de: "Entscheide schnell und stehe dazu", ar: "أقرر بسرعة وأتحمّل مسؤولية القرار", no: "Bestemmer raskt og står for valget", es: "Decido rápido y respaldo la decisión" },
      { en: "Trust my reads completely — the athlete feels it", da: "Stoler fuldt på min læsning — atleten kan mærke det", sv: "Litar helt på min läsning — atleten känner det", de: "Vertraue meinem Lesen voll — der Athlet spürt es", ar: "أثق بقراءتي تمامًا — يشعر اللاعب بذلك", no: "Stoler fullt på lesingen min — utøveren merker det", es: "Confío plenamente en mi lectura — el atleta lo siente" },
    ),
  },
  {
    id: "cc2",
    category: "coachConfidence",
    text: {
      en: "When another coach disagrees with my methodology, I…",
      da: "Når en anden træner er uenig i min metodik, så…",
      sv: "När en annan tränare inte håller med om min metodik, så…",
      de: "Wenn ein anderer Trainer meine Methodik kritisiert, dann…",
      ar: "عندما يخالفني مدرب آخر في منهجيتي، أنا…",
      no: "Når en annen trener er uenig i metodikken min, så…",
      es: "Cuando otro entrenador no comparte mi metodología, yo…",
    },
    options: opts(
      { en: "Cave and copy theirs even if it doesn't fit my athletes", da: "Knækker og kopierer deres selv om det ikke passer mine atleter", sv: "Viker mig och kopierar deras även om det inte passar mina atleter", de: "Knicke ein und kopiere ihre, auch wenn sie nicht passt", ar: "أرضخ وأقلّد منهجهم حتى لو لم يناسب لاعبيّ", no: "Gir etter og kopierer deres selv om det ikke passer utøverne mine", es: "Cedo y copio la suya aunque no encaje con mis atletas" },
      { en: "Feel small and question everything I do", da: "Føler mig lille og betvivler alt jeg gør", sv: "Känner mig liten och tvivlar på allt jag gör", de: "Fühle mich klein und zweifle an allem", ar: "أشعر بالصغر وأشكّك في كل ما أفعله", no: "Føler meg liten og tviler på alt jeg gjør", es: "Me siento pequeño y dudo de todo lo que hago" },
      { en: "Get defensive in the moment, reflect later", da: "Bliver defensiv i øjeblikket, reflekterer senere", sv: "Blir defensiv i stunden, reflekterar senare", de: "Werde im Moment defensiv, reflektiere später", ar: "أتخذ موقفًا دفاعيًا الآن، أتأمل لاحقًا", no: "Blir defensiv i øyeblikket, reflekterer senere", es: "Me pongo a la defensiva, reflexiono después" },
      { en: "Listen openly, keep what fits, leave what doesn't", da: "Lytter åbent, beholder det der passer, dropper resten", sv: "Lyssnar öppet, behåller det som passar, släpper resten", de: "Höre offen zu, behalte was passt, lasse den Rest", ar: "أستمع بانفتاح، آخذ ما يناسبني وأترك الباقي", no: "Lytter åpent, beholder det som passer, dropper resten", es: "Escucho con apertura, me quedo con lo que encaja, descarto el resto" },
      { en: "Confident dialogue — I know my framework and why", da: "Selvsikker dialog — jeg kender min ramme og hvorfor", sv: "Tryggt samtal — jag kan mitt ramverk och varför", de: "Selbstbewusster Dialog — ich kenne mein Konzept und das Warum", ar: "حوار واثق — أعرف منهجي وأسبابه", no: "Trygg dialog — jeg kjenner rammeverket mitt og hvorfor", es: "Diálogo seguro — conozco mi marco y el porqué" },
    ),
  },
  {
    id: "cc3",
    category: "coachConfidence",
    text: {
      en: "When club leadership or parents question my selection, I…",
      da: "Når klubledelse eller forældre udfordrer min udtagelse, så…",
      sv: "När klubbledning eller föräldrar ifrågasätter mitt uttag, så…",
      de: "Wenn Vereinsführung oder Eltern meine Nominierung infrage stellen, dann…",
      ar: "عندما تشكّك إدارة النادي أو الأهل في اختياراتي، أنا…",
      no: "Når klubbledelse eller foreldre stiller spørsmål ved uttaket mitt, så…",
      es: "Cuando la directiva del club o los padres cuestionan mi selección, yo…",
    },
    options: opts(
      { en: "Cave and change the lineup to keep the peace", da: "Knækker og ændrer holdet for at bevare freden", sv: "Viker mig och ändrar laget för att hålla freden", de: "Knicke ein und ändere die Aufstellung für den Frieden", ar: "أرضخ وأغيّر التشكيلة لتجنّب المشاكل", no: "Gir etter og endrer laget for å holde freden", es: "Cedo y cambio la convocatoria para no tener problemas" },
      { en: "Over-explain and apologise", da: "Overforklarer og undskylder", sv: "Överförklarar och ber om ursäkt", de: "Erkläre zu viel und entschuldige mich", ar: "أفسّر كثيرًا وأعتذر", no: "Overforklarer og beklager", es: "Sobreexplico y pido disculpas" },
      { en: "Hold the line but feel shaken afterwards", da: "Holder fast men ryster bagefter", sv: "Står på mig men skakar efteråt", de: "Bleibe standhaft, bin aber danach erschüttert", ar: "أتمسّك بقراري لكنني أتأثر بعدها", no: "Står på mitt, men er rystet etterpå", es: "Mantengo mi postura pero me quedo afectado" },
      { en: "Hold the line calmly and explain the criteria", da: "Holder fast roligt og forklarer kriterierne", sv: "Står på mig lugnt och förklarar kriterierna", de: "Bleibe ruhig dabei und erkläre die Kriterien", ar: "أتمسّك بهدوء وأشرح المعايير", no: "Står rolig på mitt og forklarer kriteriene", es: "Mantengo mi postura con calma y explico los criterios" },
      { en: "Unshakeable — I lead the conversation back to the athletes' development", da: "Urokkelig — jeg fører samtalen tilbage til atleternes udvikling", sv: "Orubblig — jag leder samtalet tillbaka till atleternas utveckling", de: "Unerschütterlich — ich lenke das Gespräch zurück zur Athletenentwicklung", ar: "ثابت تمامًا — أعيد الحوار إلى تطوّر اللاعبين", no: "Urokkelig — jeg fører samtalen tilbake til utøvernes utvikling", es: "Inquebrantable — devuelvo la conversación al desarrollo de los atletas" },
    ),
  },

  // ===== motivationBurnout (mirrors athlete motivation / fatigueMotivation) =====
  {
    id: "mb1",
    category: "motivationBurnout",
    text: {
      en: "When a long season is wearing me down, my drive to coach is…",
      da: "Når en lang sæson tærer på mig, er min drivkraft som træner…",
      sv: "När en lång säsong sliter på mig är min drivkraft som tränare…",
      de: "Wenn eine lange Saison an mir zehrt, ist mein Antrieb zu coachen…",
      ar: "عندما يستنزفني الموسم الطويل، يكون دافعي للتدريب…",
      no: "Når en lang sesong tærer på meg, er drivkraften min som trener…",
      es: "Cuando una temporada larga me desgasta, mis ganas de entrenar son…",
    },
    options: opts(
      { en: "Gone — I dread going to the gym", da: "Væk — jeg frygter at gå i hallen", sv: "Borta — jag fasar för att gå till hallen", de: "Weg — ich fürchte das Training", ar: "غير موجود — أكره الذهاب إلى الصالة", no: "Borte — jeg gruer meg til å gå i hallen", es: "Desaparecidas — me da pereza ir al gimnasio" },
      { en: "Low — I show up on autopilot", da: "Lav — jeg møder op på autopilot", sv: "Låg — jag dyker upp på autopilot", de: "Niedrig — ich erscheine im Autopilot", ar: "منخفض — أحضر تلقائيًا دون شغف", no: "Lav — jeg møter opp på autopilot", es: "Bajas — aparezco en piloto automático" },
      { en: "Up and down depending on the week", da: "Op og ned alt efter ugen", sv: "Upp och ner beroende på vecka", de: "Auf und ab je nach Woche", ar: "متذبذب حسب الأسبوع", no: "Opp og ned avhengig av uka", es: "Variables según la semana" },
      { en: "Steady — I have rituals that protect my energy", da: "Stabil — jeg har ritualer der beskytter min energi", sv: "Stadig — jag har ritualer som skyddar min energi", de: "Konstant — ich habe Rituale, die meine Energie schützen", ar: "ثابت — لدي طقوس تحمي طاقتي", no: "Stødig — jeg har ritualer som beskytter energien min", es: "Estables — tengo rituales que protegen mi energía" },
      { en: "Strong — purpose carries me through the hard weeks", da: "Stærk — formål bærer mig gennem de hårde uger", sv: "Stark — meningen bär mig genom tuffa veckor", de: "Stark — Sinn trägt mich durch harte Wochen", ar: "قوي — الهدف يحملني عبر الأسابيع الصعبة", no: "Sterk — meningen bærer meg gjennom de tøffe ukene", es: "Fuertes — el propósito me sostiene en las semanas duras" },
    ),
  },
  {
    id: "mb2",
    category: "motivationBurnout",
    text: {
      en: "My boundary between coaching and private life is…",
      da: "Min grænse mellem coaching og privatliv er…",
      sv: "Min gräns mellan coaching och privatliv är…",
      de: "Meine Grenze zwischen Coaching und Privatleben ist…",
      ar: "حدودي بين التدريب وحياتي الخاصة هي…",
      no: "Grensen min mellom coaching og privatliv er…",
      es: "Mi límite entre el entrenamiento y la vida privada es…",
    },
    options: opts(
      { en: "Non-existent — coaching invades everything", da: "Ikke-eksisterende — coaching invaderer alt", sv: "Obefintlig — coachingen tar över allt", de: "Nicht vorhanden — Coaching dringt überall ein", ar: "غير موجودة — التدريب يلتهم كل شيء", no: "Ikke-eksisterende — coaching invaderer alt", es: "Inexistente — el entrenamiento lo invade todo" },
      { en: "I answer parent messages at midnight", da: "Jeg svarer forældrebeskeder kl. midnat", sv: "Jag svarar föräldrameddelanden vid midnatt", de: "Ich beantworte Elternnachrichten um Mitternacht", ar: "أرد على رسائل الأهل في منتصف الليل", no: "Jeg svarer foreldremeldinger ved midnatt", es: "Contesto mensajes de padres a medianoche" },
      { en: "Some boundaries but they slip in season", da: "Nogle grænser, men de glider i sæson", sv: "Vissa gränser, men de glider under säsong", de: "Einige Grenzen, sie verschwimmen aber in der Saison", ar: "بعض الحدود لكنها تنزلق في الموسم", no: "Noen grenser, men de glipper i sesong", es: "Algunos límites pero se diluyen en temporada" },
      { en: "Clear hours and channels — most days I respect them", da: "Klare tider og kanaler — de fleste dage respekterer jeg dem", sv: "Tydliga tider och kanaler — oftast respekterar jag dem", de: "Klare Zeiten und Kanäle — meist respektiere ich sie", ar: "أوقات وقنوات واضحة — أحترمها معظم الأيام", no: "Tydelige tider og kanaler — som regel respekterer jeg dem", es: "Horarios y canales claros — la mayoría de días los respeto" },
      { en: "Strong and protected — recovery is part of the job", da: "Stærke og beskyttede — restitution er en del af jobbet", sv: "Starka och skyddade — återhämtning är en del av jobbet", de: "Stark und geschützt — Erholung ist Teil des Jobs", ar: "قوية ومحمية — التعافي جزء من العمل", no: "Sterke og beskyttede — restitusjon er en del av jobben", es: "Fuertes y protegidos — la recuperación es parte del trabajo" },
    ),
  },
  {
    id: "mb3",
    category: "motivationBurnout",
    text: {
      en: "When I check in with myself about why I coach, the answer is…",
      da: "Når jeg tjekker ind med mig selv om hvorfor jeg coacher, er svaret…",
      sv: "När jag stämmer av med mig själv varför jag coachar är svaret…",
      de: "Wenn ich mit mir selbst frage, warum ich coache, ist die Antwort…",
      ar: "حين أسأل نفسي لماذا أدرّب، تكون الإجابة…",
      no: "Når jeg sjekker inn med meg selv om hvorfor jeg coacher, er svaret…",
      es: "Cuando me pregunto por qué entreno, la respuesta es…",
    },
    options: opts(
      { en: "I don't know anymore — I'm running on fumes", da: "Jeg ved det ikke længere — jeg kører på damp", sv: "Jag vet inte längre — jag går på reservånga", de: "Ich weiß es nicht mehr — ich laufe auf Reserve", ar: "لم أعد أعرف — أعمل بآخر ما تبقى من طاقتي", no: "Jeg vet ikke lenger — jeg kjører på damp", es: "Ya no lo sé — voy con la reserva" },
      { en: "Mostly habit and obligation", da: "Mest vane og pligt", sv: "Mest vana och plikt", de: "Meist Gewohnheit und Pflicht", ar: "في الغالب عادة وواجب", no: "Mest vane og plikt", es: "Sobre todo costumbre y obligación" },
      { en: "Some days clear, some days foggy", da: "Nogle dage klart, andre tåget", sv: "Vissa dagar tydligt, vissa dimmigt", de: "Manche Tage klar, manche neblig", ar: "بعض الأيام واضح وبعضها ضبابي", no: "Noen dager klart, andre tåkete", es: "Algunos días claro, otros borroso" },
      { en: "Clear — develop people, not just athletes", da: "Klart — udvikle mennesker, ikke kun atleter", sv: "Tydligt — utveckla människor, inte bara atleter", de: "Klar — Menschen entwickeln, nicht nur Athleten", ar: "واضح — تطوير الناس، لا اللاعبين فحسب", no: "Klart — utvikle mennesker, ikke bare utøvere", es: "Claro — desarrollar personas, no solo atletas" },
      { en: "Crystal clear — this is my craft and I love it", da: "Krystalklart — dette er mit håndværk og jeg elsker det", sv: "Kristallklart — det här är mitt hantverk och jag älskar det", de: "Kristallklar — das ist mein Handwerk und ich liebe es", ar: "واضح كالكريستال — هذه حرفتي وأنا أعشقها", no: "Krystallklart — dette er håndverket mitt og jeg elsker det", es: "Cristalino — este es mi oficio y me apasiona" },
    ),
  },

  // ===== Additional questions (4 & 5 per category) — added in v1.2.3 expansion 18→30 =====

  // composureUnderPressure
  {
    id: "cup4",
    category: "composureUnderPressure",
    text: {
      en: "When my best athlete suddenly looks tight in warm-up before a final, I…",
      da: "Når min bedste atlet pludselig ser anspændt ud i opvarmningen før en finale, så…",
      sv: "När min bästa atlet plötsligt ser spänd ut i uppvärmningen före en final, så…",
      de: "Wenn mein bester Athlet im Aufwärmen vor einem Finale plötzlich verkrampft wirkt, dann…",
      ar: "عندما يبدو لاعبي الأفضل متوترًا فجأة خلال الإحماء قبل النهائي، أنا…",
      no: "Når min beste utøver plutselig ser anspent ut i oppvarmingen før en finale, så…",
      es: "Cuando mi mejor atleta de repente se ve tenso en el calentamiento antes de una final, yo…",
    },
    options: opts(
      { en: "Panic internally and project that anxiety onto them", da: "Får panik indvendigt og smitter dem med min angst", sv: "Får panik inombords och smittar dem med min ångest", de: "Gerate innerlich in Panik und übertrage die Angst auf sie", ar: "أصاب بالذعر داخليًا وأنقل قلقي إليه", no: "Får panikk inni meg og smitter dem med angsten min", es: "Entro en pánico por dentro y le contagio mi ansiedad" },
      { en: "Over-coach — flood them with last-minute corrections", da: "Overcoacher — overøser dem med last-minute rettelser", sv: "Övercoachar — överöser dem med sista-minuten-korrigeringar", de: "Übercoache — überschütte sie mit Korrekturen", ar: "أُغرقه بتعليمات اللحظة الأخيرة", no: "Overcoacher — overøser dem med siste-liten-korreksjoner", es: "Sobreentreno — los inundo de correcciones de último minuto" },
      { en: "Stand close but say nothing useful", da: "Står tæt på men siger ikke noget nyttigt", sv: "Står nära men säger inget användbart", de: "Stehe nahe, sage aber nichts Hilfreiches", ar: "أقف بقربه دون أن أقول شيئًا مفيدًا", no: "Står nær, men sier ingenting nyttig", es: "Me quedo cerca pero no digo nada útil" },
      { en: "Lower my voice, slow my breathing, and remind them of one anchor cue", da: "Sænker stemmen, trækker vejret langsommere og minder dem om ét anker-cue", sv: "Sänker rösten, andas långsammare och påminner om ett ankar-cue", de: "Senke die Stimme, atme langsamer und erinnere an einen Anker-Cue", ar: "أخفض صوتي، أتنفس ببطء، وأذكّره بإشارة مرساة واحدة", no: "Senker stemmen, puster saktere og minner dem om én anker-cue", es: "Bajo la voz, respiro más lento y le recuerdo una indicación ancla" },
      { en: "Become the calmest person in the room — they borrow it from me", da: "Bliver den roligste person i rummet — de låner ro fra mig", sv: "Blir den lugnaste i rummet — de lånar lugnet från mig", de: "Werde der ruhigste Mensch im Raum — sie übernehmen es von mir", ar: "أكون الأهدأ في المكان — يستعيرون مني الهدوء", no: "Blir den roligste i rommet — de låner roen fra meg", es: "Soy la persona más tranquila del lugar — toman mi calma prestada" },
    ),
  },
  {
    id: "cup5",
    category: "composureUnderPressure",
    text: {
      en: "When several things go wrong at the same competition, I…",
      da: "Når flere ting går galt ved samme stævne, så…",
      sv: "När flera saker går fel på samma tävling, så…",
      de: "Wenn bei einem Wettkampf mehrere Dinge gleichzeitig schiefgehen, dann…",
      ar: "عندما تسوء عدة أمور في البطولة نفسها، أنا…",
      no: "Når flere ting går galt på samme stevne, så…",
      es: "Cuando varias cosas salen mal en la misma competición, yo…",
    },
    options: opts(
      { en: "Spiral — every new problem doubles my stress", da: "Går i spiral — hvert nyt problem fordobler mit stress", sv: "Spiralerar — varje nytt problem dubblar stressen", de: "Drehe ab — jedes neue Problem verdoppelt den Stress", ar: "أدخل في دوامة — كل مشكلة جديدة تضاعف توتري", no: "Spiraler — hvert nye problem dobler stresset", es: "Entro en espiral — cada problema nuevo me duplica el estrés" },
      { en: "Get sharp with my staff or family members helping", da: "Bliver kort for hovedet over for stab eller familie der hjælper", sv: "Blir kort i tonen mot personal eller familj som hjälper", de: "Werde scharf zu Helfern oder Familie", ar: "أكون حادًا مع طاقمي أو الأهل الذين يساعدون", no: "Blir kort i tonen mot stab eller familie som hjelper", es: "Me pongo cortante con mi staff o con la familia que ayuda" },
      { en: "Push through but feel wrecked afterwards", da: "Presser igennem men er smadret bagefter", sv: "Kör vidare men är slut efteråt", de: "Ziehe es durch, bin danach aber zerstört", ar: "أتحامل لكنني محطّم بعدها", no: "Presser meg gjennom, men er ødelagt etterpå", es: "Sigo adelante pero quedo destrozado después" },
      { en: "Triage — pick the next single most important action", da: "Triagerer — vælger den ene vigtigste handling lige nu", sv: "Triagerar — väljer den enda viktigaste åtgärden härnäst", de: "Priorisiere — wähle die nächste wichtigste Handlung", ar: "أرتّب الأولويات — أختار الإجراء الأهم التالي", no: "Triagerer — velger den ene viktigste handlingen nå", es: "Triajeo — elijo la próxima acción más importante" },
      { en: "Feel calmer the more chaotic it gets — I trust my process", da: "Bliver mere rolig jo mere kaotisk det bliver — jeg stoler på min proces", sv: "Blir lugnare ju mer kaotiskt det blir — jag litar på min process", de: "Werde ruhiger, je chaotischer es wird — ich vertraue dem Prozess", ar: "أصبح أهدأ كلما زادت الفوضى — أثق بمنهجي", no: "Blir roligere jo mer kaotisk det blir — jeg stoler på prosessen", es: "Me calmo más cuanto más caótico se vuelve — confío en mi proceso" },
    ),
  },

  // sidelineCalm
  {
    id: "sc4",
    category: "sidelineCalm",
    text: {
      en: "Right before the first fight of the day, my breathing is…",
      da: "Lige før dagens første kamp er min vejrtrækning…",
      sv: "Precis före dagens första match är min andning…",
      de: "Direkt vor dem ersten Kampf des Tages ist meine Atmung…",
      ar: "قبل أول مباراة في اليوم مباشرة، يكون تنفسي…",
      no: "Rett før dagens første kamp er pusten min…",
      es: "Justo antes del primer combate del día, mi respiración es…",
    },
    options: opts(
      { en: "Shallow and rapid — chest only", da: "Overfladisk og hurtig — kun bryst", sv: "Ytlig och snabb — bara bröst", de: "Flach und schnell — nur Brust", ar: "سطحي وسريع — في الصدر فقط", no: "Overflatisk og rask — bare bryst", es: "Superficial y rápida — solo pecho" },
      { en: "Held — I notice I keep forgetting to exhale", da: "Holdt — jeg opdager at jeg glemmer at puste ud", sv: "Hållen — jag märker att jag glömmer andas ut", de: "Angehalten — ich vergesse das Ausatmen", ar: "محبوس — ألاحظ أنني أنسى الزفير", no: "Holdt — jeg merker at jeg glemmer å puste ut", es: "Contenida — noto que olvido exhalar" },
      { en: "Uneven but I can settle it if I try", da: "Ujævn men jeg kan stabilisere den hvis jeg prøver", sv: "Ojämn men jag kan lugna den om jag försöker", de: "Ungleichmäßig, aber ich kann sie beruhigen", ar: "غير منتظم لكن أستطيع تهدئته إن حاولت", no: "Ujevn, men jeg kan roe den ned om jeg prøver", es: "Irregular pero la calmo si lo intento" },
      { en: "Slow and into my belly — I run my pre-fight breathing", da: "Langsom og ned i maven — jeg kører min vejrtrækning før kampen", sv: "Långsam och ner i magen — jag kör min andning före match", de: "Langsam in den Bauch — meine Pre-Fight-Atmung läuft", ar: "بطيء وعميق إلى البطن — أنفّذ روتين تنفسي قبل المباراة", no: "Sakte og ned i magen — jeg kjører pusterutinen min", es: "Lenta y al abdomen — ejecuto mi respiración previa al combate" },
      { en: "Effortlessly calm — my body is in competition mode", da: "Ubesværet rolig — min krop er i konkurrencemodus", sv: "Lugn utan ansträngning — kroppen är i tävlingsläge", de: "Mühelos ruhig — mein Körper ist im Wettkampfmodus", ar: "هادئ بلا جهد — جسدي في وضع المنافسة", no: "Rolig uten anstrengelse — kroppen er i konkurransemodus", es: "Calmada sin esfuerzo — mi cuerpo está en modo competición" },
    ),
  },
  {
    id: "sc5",
    category: "sidelineCalm",
    text: {
      en: "After the buzzer ends a tight round, in the corner my emotions are…",
      da: "Når bzzzeren afslutter en tæt runde, er mine følelser i hjørnet…",
      sv: "När summern avslutar en tät rond är mina känslor i hörnet…",
      de: "Wenn der Gong eine knappe Runde beendet, sind meine Emotionen in der Ecke…",
      ar: "عند انتهاء جولة متقاربة، تكون مشاعري في الزاوية…",
      no: "Når bzzeren avslutter en tett runde, er følelsene mine i hjørnet…",
      es: "Cuando el zumbador termina un round ajustado, en la esquina mis emociones son…",
    },
    options: opts(
      { en: "Boiling — I can't hide my frustration or excitement", da: "Kogende — jeg kan ikke skjule frustration eller begejstring", sv: "Kokande — jag kan inte dölja min frustration eller upprymdhet", de: "Kochend — ich kann Frust oder Aufregung nicht verbergen", ar: "ملتهبة — لا أستطيع إخفاء إحباطي أو حماستي", no: "Kokende — jeg klarer ikke skjule frustrasjon eller begeistring", es: "En ebullición — no puedo ocultar frustración o euforia" },
      { en: "Leaking — my face tells the athlete everything", da: "Lækker — mit ansigt fortæller atleten alt", sv: "Läcker — mitt ansikte berättar allt för atleten", de: "Verrate alles — mein Gesicht spricht Bände", ar: "تتسرّب — وجهي يخبر اللاعب بكل شيء", no: "Lekker — ansiktet mitt forteller utøveren alt", es: "Se filtran — mi cara le cuenta todo al atleta" },
      { en: "Controlled mostly, but voice rises", da: "For det meste kontrolleret, men stemmen stiger", sv: "Mest kontrollerade men rösten höjs", de: "Meist kontrolliert, aber Stimme wird laut", ar: "محكومة في الغالب لكن صوتي يرتفع", no: "For det meste kontrollert, men stemmen stiger", es: "Sobre todo controladas, pero la voz sube" },
      { en: "Neutral face, steady voice — emotions parked", da: "Neutralt ansigt, rolig stemme — følelser parkeret", sv: "Neutralt ansikte, stadig röst — känslor parkerade", de: "Neutrales Gesicht, ruhige Stimme — Emotionen geparkt", ar: "وجه محايد، صوت ثابت — مشاعر مؤجلة", no: "Nøytralt ansikt, stødig stemme — følelser parkert", es: "Cara neutra, voz firme — emociones aparcadas" },
      { en: "Calm presence that gives the athlete oxygen to reset", da: "Roligt nærvær der giver atleten ilt til at nulstille", sv: "Lugn närvaro som ger atleten syre att nollställa", de: "Ruhige Präsenz, die dem Athleten Raum zum Resetten gibt", ar: "حضور هادئ يمنح اللاعب متنفسًا لإعادة الضبط", no: "Rolig nærvær som gir utøveren rom til å nullstille", es: "Presencia calmada que le da al atleta aire para resetearse" },
    ),
  },

  // decisionMakingUnderChaos
  {
    id: "dm4",
    category: "decisionMakingUnderChaos",
    text: {
      en: "When I have to switch tactics mid-fight, my mental clarity is…",
      da: "Når jeg skal skifte taktik midt i en kamp, er min mentale klarhed…",
      sv: "När jag måste byta taktik mitt i en match är min mentala klarhet…",
      de: "Wenn ich mitten im Kampf die Taktik wechseln muss, ist meine Klarheit…",
      ar: "حين أحتاج لتغيير التكتيك أثناء المباراة، يكون صفائي الذهني…",
      no: "Når jeg må bytte taktikk midt i en kamp, er den mentale klarheten min…",
      es: "Cuando tengo que cambiar de táctica a mitad del combate, mi claridad mental es…",
    },
    options: opts(
      { en: "Foggy — I default to the same instructions louder", da: "Tåget — jeg falder tilbage på samme instrukser bare højere", sv: "Dimmig — jag faller tillbaka på samma instruktioner men högre", de: "Vernebelt — ich wiederhole dieselben Anweisungen lauter", ar: "ضبابي — أكرر التعليمات نفسها بصوت أعلى", no: "Tåkete — jeg faller tilbake på samme instruksjoner høyere", es: "Borrosa — repito las mismas instrucciones más alto" },
      { en: "Reactive — I copy what the opposing coach did", da: "Reaktiv — jeg kopierer hvad modstandercoachen gjorde", sv: "Reaktiv — jag kopierar vad motståndartränaren gjorde", de: "Reaktiv — ich kopiere den gegnerischen Trainer", ar: "ردّ فعل — أقلّد ما فعله مدرب الخصم", no: "Reaktiv — jeg kopierer det motstandertreneren gjorde", es: "Reactiva — copio lo que hizo el entrenador rival" },
      { en: "I see the change needed but explain it too slowly", da: "Jeg ser ændringen der skal til men forklarer den for langsomt", sv: "Jag ser förändringen som behövs men förklarar för långsamt", de: "Sehe die nötige Änderung, erkläre sie aber zu langsam", ar: "أرى التغيير المطلوب لكني أشرحه ببطء شديد", no: "Ser endringen som trengs, men forklarer for sakte", es: "Veo el cambio necesario pero lo explico demasiado lento" },
      { en: "Clear — I name the new plan in one sentence", da: "Klar — jeg navngiver den nye plan i én sætning", sv: "Tydlig — jag namnger den nya planen i en mening", de: "Klar — ich benenne den neuen Plan in einem Satz", ar: "صافٍ — أصف الخطة الجديدة في جملة واحدة", no: "Klar — jeg navngir den nye planen i én setning", es: "Clara — nombro el nuevo plan en una frase" },
      { en: "Surgical — I see the win condition and direct the athlete to it", da: "Kirurgisk — jeg ser sejrsbetingelsen og dirigerer atleten dertil", sv: "Kirurgisk — jag ser vinstvägen och leder atleten dit", de: "Chirurgisch — ich sehe den Sieg-Pfad und leite den Athleten dorthin", ar: "دقيق كالجراح — أرى شرط الفوز وأقود اللاعب إليه", no: "Kirurgisk — jeg ser veien til seier og leder utøveren dit", es: "Quirúrgica — veo la vía de victoria y guío al atleta hacia ella" },
    ),
  },
  {
    id: "dm5",
    category: "decisionMakingUnderChaos",
    text: {
      en: "When I'm cornering two athletes back-to-back on different mats, I…",
      da: "Når jeg coacher to atleter i træk på forskellige måtter, så…",
      sv: "När jag coachar två atleter i följd på olika mattor, så…",
      de: "Wenn ich zwei Athleten nacheinander auf verschiedenen Matten betreue, dann…",
      ar: "عندما أدرّب لاعبين متتاليين على بسطين مختلفين، أنا…",
      no: "Når jeg coacher to utøvere etter hverandre på ulike matter, så…",
      es: "Cuando hago de coach a dos atletas seguidos en tatamis distintos, yo…",
    },
    options: opts(
      { en: "Mix them up — the second athlete gets the first one's plan", da: "Blander dem — atlet nummer to får atlet ets plan", sv: "Blandar ihop dem — atlet två får atlet etts plan", de: "Verwechsle sie — der zweite Athlet bekommt den Plan des ersten", ar: "أخلط بينهما — اللاعب الثاني يأخذ خطة الأول", no: "Blander dem — utøver to får utøver én sin plan", es: "Los mezclo — el segundo recibe el plan del primero" },
      { en: "Arrive at mat 2 still thinking about mat 1", da: "Ankommer til mat 2 stadig tænkende på mat 1", sv: "Anländer till matta 2 men tänker fortfarande på matta 1", de: "Komme an Matte 2 an, denke noch an Matte 1", ar: "أصل إلى البساط 2 وأنا ما زلت أفكر بالبساط 1", no: "Kommer til matte 2, men tenker fortsatt på matte 1", es: "Llego al tatami 2 todavía pensando en el 1" },
      { en: "Manage but feel scattered the whole bracket", da: "Klarer det men føler mig spredt hele puljen igennem", sv: "Klarar det men känner mig splittrad hela poolen", de: "Schaffe es, fühle mich aber den ganzen Pool zerstreut", ar: "أتدبّر الأمر لكنني مشتت طوال المسابقة", no: "Klarer det, men føler meg spredt gjennom hele puljen", es: "Lo gestiono pero me siento disperso todo el cuadro" },
      { en: "Have a 10-second reset routine between mats", da: "Har en 10-sekunders nulstillings-rutine mellem måtterne", sv: "Har en 10-sekunders-resetrutin mellan mattorna", de: "Habe eine 10-Sekunden-Reset-Routine zwischen den Matten", ar: "لديّ روتين إعادة ضبط مدته 10 ثوانٍ بين البساطين", no: "Har en 10-sekunders nullstillings-rutine mellom mattene", es: "Tengo una rutina de reseteo de 10 segundos entre tatamis" },
      { en: "Each athlete gets my full presence — they never feel shared", da: "Hver atlet får mit fulde nærvær — de føler sig aldrig delt", sv: "Varje atlet får min fulla närvaro — de känner sig aldrig delade", de: "Jeder Athlet bekommt meine volle Präsenz — sie fühlen sich nie geteilt", ar: "كل لاعب يحصل على حضوري الكامل — لا يشعرون قط أنني موزّع", no: "Hver utøver får full tilstedeværelse — de føler seg aldri delt", es: "Cada atleta recibe mi presencia plena — nunca se sienten compartidos" },
    ),
  },

  // roleModelAfterLoss
  {
    id: "rm4",
    category: "roleModelAfterLoss",
    text: {
      en: "When my athlete cries after losing, my first instinct is to…",
      da: "Når min atlet græder efter et nederlag, er min første impuls at…",
      sv: "När min atlet gråter efter en förlust är min första impuls att…",
      de: "Wenn mein Athlet nach einer Niederlage weint, ist mein erster Impuls…",
      ar: "عندما يبكي لاعبي بعد الخسارة، تكون أول ردة فعلي…",
      no: "Når utøveren min gråter etter et tap, er min første impuls å…",
      es: "Cuando mi atleta llora tras perder, mi primer impulso es…",
    },
    options: opts(
      { en: "Tell them to toughen up — crying won't change the result", da: "Sige de skal være hårde — gråd ændrer ikke resultatet", sv: "Säga åt dem att skärpa sig — gråt ändrar inget", de: "Sage, sie sollen sich zusammenreißen — Weinen ändert nichts", ar: "أطلب منه أن يكون قويًا — البكاء لن يغيّر شيئًا", no: "Si de må mann seg opp — gråt endrer ikke resultatet", es: "Decirle que se aguante — llorar no cambia el resultado" },
      { en: "Look away — I don't know what to do with the emotion", da: "Kigge væk — jeg ved ikke hvad jeg skal gøre med følelsen", sv: "Titta bort — jag vet inte vad jag ska göra med känslan", de: "Wegschauen — ich weiß mit der Emotion nichts anzufangen", ar: "أنظر بعيدًا — لا أعرف ماذا أفعل بالمشاعر", no: "Se vekk — jeg vet ikke hva jeg skal gjøre med følelsen", es: "Mirar a otro lado — no sé qué hacer con la emoción" },
      { en: "Pat them on the shoulder and change the subject", da: "Klappe dem på skulderen og skifte emne", sv: "Klappa dem på axeln och byta ämne", de: "Auf die Schulter klopfen und das Thema wechseln", ar: "أربّت على كتفه وأغيّر الموضوع", no: "Klappe på skulderen og skifte tema", es: "Darle una palmada y cambiar de tema" },
      { en: "Sit with them quietly until they're ready to talk", da: "Sidde stille med dem indtil de er klar til at tale", sv: "Sitta tyst med dem tills de är redo att prata", de: "Schweigend bei ihnen sitzen, bis sie reden wollen", ar: "أجلس بصمت بجانبه حتى يكون مستعدًا للحديث", no: "Sitte stille hos dem til de er klare for å snakke", es: "Sentarme con ellos en silencio hasta que quieran hablar" },
      { en: "Name the feeling, honour the effort, and remind them who they are", da: "Sætte ord på følelsen, ære indsatsen og minde dem om hvem de er", sv: "Sätta ord på känslan, hedra insatsen och påminna om vilka de är", de: "Das Gefühl benennen, den Einsatz würdigen, sie an ihr Wesen erinnern", ar: "أسمي الشعور، أكرّم الجهد، وأذكّره بمن هو حقًا", no: "Sette ord på følelsen, hedre innsatsen og minne dem om hvem de er", es: "Nombrar el sentimiento, honrar el esfuerzo y recordarles quiénes son" },
    ),
  },
  {
    id: "rm5",
    category: "roleModelAfterLoss",
    text: {
      en: "The Monday after a tough weekend tournament, in training I am…",
      da: "Mandagen efter en hård turneringsweekend er jeg til træning…",
      sv: "Måndagen efter en tuff tävlingshelg är jag på träning…",
      de: "Am Montag nach einem harten Turnier-Wochenende bin ich im Training…",
      ar: "يوم الإثنين بعد بطولة قاسية في عطلة الأسبوع، أكون في التدريب…",
      no: "Mandagen etter en tøff turneringshelg er jeg på trening…",
      es: "El lunes después de un fin de semana duro de torneo, en entrenamiento estoy…",
    },
    options: opts(
      { en: "Cold and punishing — I want them to feel the loss", da: "Kold og straffende — jeg vil have de skal mærke nederlaget", sv: "Kall och straffande — jag vill att de ska känna förlusten", de: "Kalt und strafend — sie sollen die Niederlage spüren", ar: "بارد وعقابي — أريدهم أن يشعروا بالخسارة", no: "Kald og straffende — jeg vil de skal kjenne tapet", es: "Frío y castigador — quiero que sientan la derrota" },
      { en: "Skip the topic entirely — pretend nothing happened", da: "Springer emnet helt over — lader som om intet skete", sv: "Hoppar över ämnet helt — låtsas som inget hänt", de: "Übergehe das Thema komplett — tue, als wäre nichts gewesen", ar: "أتجاهل الموضوع تمامًا — وكأن شيئًا لم يحدث", no: "Hopper over temaet helt — later som ingenting skjedde", es: "Evito el tema por completo — finjo que no pasó nada" },
      { en: "Talk about it but my body language says I'm still bitter", da: "Taler om det men mit kropssprog siger jeg stadig er bitter", sv: "Pratar om det men kroppsspråket säger att jag fortfarande är bitter", de: "Spreche darüber, aber meine Körpersprache verrät meinen Frust", ar: "أتحدث عنها لكن لغة جسدي تكشف مرارتي", no: "Snakker om det, men kroppsspråket sier at jeg fortsatt er bitter", es: "Hablo de ello pero mi lenguaje corporal sigue mostrando rencor" },
      { en: "Open the floor — short, honest review, then forward", da: "Åbner gulvet — kort, ærlig gennemgang, så fremad", sv: "Öppnar för samtal — kort, ärlig genomgång, sedan framåt", de: "Mache es zum Thema — kurze ehrliche Auswertung, dann nach vorn", ar: "أفتح المجال — مراجعة قصيرة وصادقة ثم نتقدم", no: "Åpner for samtale — kort, ærlig gjennomgang, så framover", es: "Abro el tema — repaso corto y honesto, después adelante" },
      { en: "Lead with curiosity — 'what did we learn?' — energy is forward and positive", da: "Leder med nysgerrighed — 'hvad lærte vi?' — energien er fremad og positiv", sv: "Leder med nyfikenhet — 'vad lärde vi oss?' — energin är framåt och positiv", de: "Führe mit Neugier — 'was haben wir gelernt?' — Energie nach vorn", ar: "أقود بفضول — 'ماذا تعلمنا؟' — الطاقة إيجابية وإلى الأمام", no: "Leder med nysgjerrighet — 'hva lærte vi?' — energien er framover og positiv", es: "Lidero con curiosidad — '¿qué aprendimos?' — energía hacia adelante y positiva" },
    ),
  },

  // coachConfidence
  {
    id: "cc4",
    category: "coachConfidence",
    text: {
      en: "When my methodology is producing slow results, I…",
      da: "Når min metodik giver langsomme resultater, så…",
      sv: "När min metodik ger långsamma resultat, så…",
      de: "Wenn meine Methodik nur langsam Ergebnisse liefert, dann…",
      ar: "عندما تعطي منهجيتي نتائج بطيئة، أنا…",
      no: "Når metodikken min gir trege resultater, så…",
      es: "Cuando mi metodología produce resultados lentos, yo…",
    },
    options: opts(
      { en: "Scrap it after one bad month and chase the latest trend", da: "Skroter den efter én dårlig måned og jagter nyeste trend", sv: "Skrotar den efter en dålig månad och jagar senaste trenden", de: "Verwerfe sie nach einem schlechten Monat und springe auf jeden Trend", ar: "أتركها بعد شهر سيء واحد وأتبع أحدث صيحة", no: "Skroter den etter én dårlig måned og jakter siste trend", es: "La descarto tras un mes malo y persigo la última tendencia" },
      { en: "Doubt loudly in front of my athletes", da: "Tvivler højlydt foran mine atleter", sv: "Tvivlar högt inför mina atleter", de: "Zweifle laut vor meinen Athleten", ar: "أشكّك بصوت عالٍ أمام لاعبيّ", no: "Tviler høyt foran utøverne mine", es: "Dudo en voz alta delante de mis atletas" },
      { en: "Stick with it but feel anxious every session", da: "Holder fast men er nervøs hver træning", sv: "Håller fast men är orolig varje pass", de: "Bleibe dabei, bin aber jede Einheit nervös", ar: "أتمسك بها لكنني قلق في كل جلسة", no: "Holder fast, men er nervøs på hver økt", es: "Sigo con ella pero estoy ansioso en cada sesión" },
      { en: "Trust the process and look for the lead indicators", da: "Stoler på processen og kigger efter de tidlige indikatorer", sv: "Litar på processen och letar efter tidiga indikatorer", de: "Vertraue dem Prozess und schaue auf Frühindikatoren", ar: "أثق بالعملية وأبحث عن المؤشرات المبكرة", no: "Stoler på prosessen og ser etter tidlige indikatorer", es: "Confío en el proceso y busco los indicadores tempranos" },
      { en: "Stay rock-solid — long-term thinking is my edge", da: "Forbliver klippefast — langsigtet tænkning er min styrke", sv: "Står klippfast — långsiktigt tänkande är min styrka", de: "Bleibe felsenfest — Langfristdenken ist mein Vorteil", ar: "أبقى صلبًا كالصخر — التفكير طويل المدى هو ميزتي", no: "Står som fjell — langsiktig tenkning er styrken min", es: "Me mantengo firme como roca — pensar a largo plazo es mi ventaja" },
    ),
  },
  {
    id: "cc5",
    category: "coachConfidence",
    text: {
      en: "When I have to deliver hard feedback to a senior athlete, I…",
      da: "Når jeg skal give hård feedback til en senior-atlet, så…",
      sv: "När jag måste ge tuff feedback till en senior-atlet, så…",
      de: "Wenn ich einem erfahrenen Athleten harte Rückmeldung geben muss, dann…",
      ar: "عندما يجب أن أُعطي ملاحظات صعبة للاعب كبير، أنا…",
      no: "Når jeg må gi tøff tilbakemelding til en senior-utøver, så…",
      es: "Cuando tengo que dar feedback duro a un atleta senior, yo…",
    },
    options: opts(
      { en: "Avoid it and hope it resolves itself", da: "Undgår det og håber det løser sig selv", sv: "Undviker det och hoppas det löser sig", de: "Vermeide es und hoffe, es regelt sich", ar: "أتجنّب الأمر وآمل أن يحلّ نفسه", no: "Unngår det og håper det løser seg selv", es: "Lo evito y espero que se resuelva solo" },
      { en: "Soften it so much the message disappears", da: "Pakker det så meget ind at budskabet forsvinder", sv: "Mjukar upp det så att budskapet försvinner", de: "Verpacke es so weich, dass die Botschaft verschwindet", ar: "أُلطّفها لدرجة تختفي معها الرسالة", no: "Pakker det så mykt inn at budskapet forsvinner", es: "Lo suavizo tanto que el mensaje desaparece" },
      { en: "Deliver it but rehearse it ten times first", da: "Leverer det men øver det ti gange først", sv: "Levererar det men övar tio gånger först", de: "Sage es, übe es aber zehnmal vorher", ar: "أقولها لكنني أتدرّب عليها عشر مرات أولًا", no: "Sier det, men øver ti ganger først", es: "Lo digo pero lo ensayo diez veces antes" },
      { en: "Direct, kind, specific — leave the door open", da: "Direkte, venlig, konkret — lader døren stå åben", sv: "Direkt, vänlig, specifik — lämnar dörren öppen", de: "Direkt, freundlich, konkret — Tür offen lassen", ar: "مباشر، لطيف، محدّد — أُبقي الباب مفتوحًا", no: "Direkte, vennlig, spesifikk — lar døra stå åpen", es: "Directo, amable, específico — dejo la puerta abierta" },
      { en: "They thank me for it later — that's how I know I led well", da: "De takker mig for det senere — sådan ved jeg at jeg ledte godt", sv: "De tackar mig senare — så vet jag att jag ledde rätt", de: "Sie danken mir später — daran erkenne ich gute Führung", ar: "يشكرونني لاحقًا — هكذا أعرف أنني قُدت بشكل صحيح", no: "De takker meg senere — slik vet jeg at jeg ledet riktig", es: "Me lo agradecen después — así sé que lideré bien" },
    ),
  },

  // motivationBurnout
  {
    id: "mb4",
    category: "motivationBurnout",
    text: {
      en: "When I think about another full season ahead, I feel…",
      da: "Når jeg tænker på endnu en fuld sæson forude, føler jeg…",
      sv: "När jag tänker på ytterligare en hel säsong framöver känner jag…",
      de: "Wenn ich an eine weitere ganze Saison denke, fühle ich…",
      ar: "حين أفكر بموسم كامل آخر أمامي، أشعر…",
      no: "Når jeg tenker på enda en full sesong framover, kjenner jeg…",
      es: "Cuando pienso en otra temporada completa por delante, siento…",
    },
    options: opts(
      { en: "Dread — I don't see how I'll make it through", da: "Frygt — jeg kan ikke se hvordan jeg klarer den", sv: "Ångest — jag vet inte hur jag ska orka", de: "Angst — ich weiß nicht, wie ich es schaffen soll", ar: "خوفًا — لا أرى كيف سأتحمّل", no: "Gru — jeg ser ikke hvordan jeg skal klare det", es: "Pavor — no veo cómo lo voy a sacar" },
      { en: "Heaviness — it feels like a duty more than a calling", da: "Tunghed — det føles mere som en pligt end et kald", sv: "Tunghet — det känns mer som plikt än kallelse", de: "Schwere — eher Pflicht als Berufung", ar: "ثِقلًا — يبدو واجبًا أكثر من شغف", no: "Tunghet — det føles mer som plikt enn kall", es: "Pesadez — se siente más como obligación que como vocación" },
      { en: "Mixed — pockets of excitement, pockets of fatigue", da: "Blandet — øer af begejstring, øer af træthed", sv: "Blandat — stunder av glädje, stunder av trötthet", de: "Gemischt — Momente der Freude, Momente der Erschöpfung", ar: "مشاعر مختلطة — لحظات حماس ولحظات إرهاق", no: "Blandet — øyeblikk av glede, øyeblikk av tretthet", es: "Mezclados — momentos de ilusión, momentos de cansancio" },
      { en: "Quiet readiness — I know the rhythm and how to pace myself", da: "Stille parathed — jeg kender rytmen og hvordan jeg doserer mig selv", sv: "Stilla beredskap — jag kan rytmen och vet hur jag doserar mig", de: "Stille Bereitschaft — ich kenne den Rhythmus", ar: "جاهزية هادئة — أعرف الإيقاع وكيف أوزّع طاقتي", no: "Stille beredskap — jeg kjenner rytmen og hvordan jeg doserer", es: "Disposición tranquila — conozco el ritmo y sé dosificarme" },
      { en: "Excited — I can already see the athletes I'll get to develop", da: "Begejstret — jeg kan allerede se atleterne jeg får udvikle", sv: "Entusiastisk — jag ser redan atleterna jag får utveckla", de: "Vorfreude — ich sehe schon die Athleten, die ich entwickeln darf", ar: "متحمسًا — أرى مسبقًا اللاعبين الذين سأطوّرهم", no: "Begeistret — jeg ser allerede utøverne jeg får utvikle", es: "Ilusionado — ya veo a los atletas que voy a poder desarrollar" },
    ),
  },
  {
    id: "mb5",
    category: "motivationBurnout",
    text: {
      en: "How well I take care of my own body and mind during peak season is…",
      da: "Hvor godt jeg passer på min krop og sind i højsæsonen er…",
      sv: "Hur väl jag tar hand om min egen kropp och sinne under högsäsong är…",
      de: "Wie gut ich in der Hochsaison auf Körper und Geist achte, ist…",
      ar: "مدى اعتنائي بجسدي وعقلي خلال ذروة الموسم هو…",
      no: "Hvor godt jeg tar vare på egen kropp og sinn i toppsesong er…",
      es: "Cómo cuido mi propio cuerpo y mente en plena temporada es…",
    },
    options: opts(
      { en: "Terribly — I'm last on my own priority list", da: "Forfærdeligt — jeg er sidst på min egen prioritetsliste", sv: "Uselt — jag är sist på min egen prioriteringslista", de: "Furchtbar — ich stehe auf meiner Prioritätenliste ganz unten", ar: "سيء جدًا — أنا آخر شخص على قائمة أولوياتي", no: "Forferdelig — jeg står sist på min egen prioriteringsliste", es: "Pésimamente — soy el último en mi propia lista de prioridades" },
      { en: "Poorly — sleep, food, training all slip", da: "Dårligt — søvn, mad og træning glider", sv: "Dåligt — sömn, mat och träning glider", de: "Schlecht — Schlaf, Essen, Sport leiden alle", ar: "ضعيف — النوم والأكل والتمرين كله ينزلق", no: "Dårlig — søvn, mat og trening glipper", es: "Mal — el sueño, la comida y mi entrenamiento se descuidan" },
      { en: "Patchy — some weeks good, some weeks survival", da: "Pletvist — nogle uger gode, nogle uger overlevelse", sv: "Ojämnt — vissa veckor bra, vissa överlevnad", de: "Lückenhaft — manche Wochen gut, manche nur Überleben", ar: "متفاوت — أسابيع جيدة وأسابيع للنجاة فقط", no: "Flekkvis — noen uker bra, noen uker overlevelse", es: "Irregular — semanas buenas, semanas de supervivencia" },
      { en: "Mostly good — I protect non-negotiables", da: "For det meste godt — jeg beskytter de ikke-forhandlebare", sv: "Mest bra — jag skyddar mina icke-förhandlingsbara", de: "Meist gut — ich schütze meine Non-Negotiables", ar: "جيد في الغالب — أحمي ما لا يقبل التفاوض", no: "Stort sett bra — jeg verner de ikke-forhandlbare", es: "Bastante bien — protejo lo no negociable" },
      { en: "Excellent — I model the recovery I preach to my athletes", da: "Fremragende — jeg er rollemodel for den restitution jeg prædiker", sv: "Utmärkt — jag är förebild för återhämtningen jag predikar", de: "Hervorragend — ich lebe die Erholung, die ich predige, vor", ar: "ممتاز — أكون قدوة في التعافي الذي أعلّمه للاعبيّ", no: "Utmerket — jeg er rollemodell for restitusjonen jeg forkynner", es: "Excelente — encarno la recuperación que predico a mis atletas" },
    ),
  },
];

