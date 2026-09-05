// FÆLLES KILDE for Klubanalysens tekster.
// Bruges BÅDE af frontend (src/data/clubAssessment.ts re-eksporterer herfra)
// og af edge function `send-assessment-report`, så resultatside og rapportmail
// aldrig kan komme ud af sync. Filen må derfor ikke indeholde imports.

export type DimensionContent = {
  key: string;
  name: string;
  shortName: string;
  consequence: string;
  firstStep: string;
  /** Spørgsmål til næste bestyrelsesmøde, når denne dimension er svagest. */
  boardQuestion: string;
};

export const DIMENSION_CONTENT: DimensionContent[] = [
  {
    key: "red_traad",
    name: "Rød tråd",
    shortName: "Rød tråd",
    consequence:
      "Hver gang en udøver skifter årgang, starter udviklingen delvist forfra. Det koster typisk en halv sæson pr. skifte — og det er den halve sæson, konkurrenterne bruger på at rykke.",
    firstStep:
      "Skriv ét A4 pr. årgang: hvad skal en udøver kunne, når hun forlader den. Det er den mindste brugbare version af en rød tråd.",
    boardQuestion:
      "Hvis vi mistede vores tre bedste trænere i morgen, hvilke årgange ville stå uden en plan?",
  },
  {
    key: "traenerkapacitet",
    name: "Trænerkapacitet",
    shortName: "Trænere",
    consequence:
      "Klubbens viden bor i enkeltpersoner. Næste trænerudskiftning nulstiller det, holdet har bygget op — og den udskiftning kommer, uanset hvor gode de er nu.",
    firstStep:
      "Bed hver træner skrive ti linjer om sit hold, som en afløser kunne overtage på. Det afdækker på en aften, hvor meget der kun findes i hovedet.",
    boardQuestion:
      "Hvad koster det os hver gang, vi lærer en ny træner op fra nul — i timer, ikke i kroner?",
  },
  {
    key: "data",
    name: "Data & dokumentation",
    shortName: "Data",
    consequence:
      "I kan ikke se, om en udøver er i fremgang eller på vej mod overbelastning, før det viser sig i resultaterne. På det tidspunkt er beslutningen truffet for jer.",
    firstStep:
      "Vælg tre parametre — ikke tredive — og mål dem på ét hold i otte uger. Beslutningsgrundlaget er vigtigere end datamængden.",
    boardQuestion:
      "Hvilke tre tal vil vi kunne se på næste møde, og hvem henter dem?",
  },
  {
    key: "kultur",
    name: "Kultur & fastholdelse",
    shortName: "Kultur",
    consequence:
      "Frafald opdages bagudrettet. Når I hører om det, blev beslutningen truffet for uger siden — af en udøver, ingen nåede at tale med.",
    firstStep:
      "Tæl, hvor mange der stoppede i hver årgang sidste sæson. Bare tallet. De fleste klubber har aldrig gjort det, og det flytter samtalen i bestyrelsen med det samme.",
    boardQuestion:
      "Hvor mange stoppede sidste sæson, og hvad ved vi om hvorfor?",
  },
  {
    key: "ledelse",
    name: "Ledelse & retning",
    shortName: "Ledelse",
    consequence:
      "Retningen afhænger af, hvem der sidder i bestyrelsen. Én generalforsamling kan nulstille tre års arbejde, fordi retningen aldrig blev forankret uden for personerne.",
    firstStep:
      "Skriv ned, hvem der træffer sportslige beslutninger, og hvem der ikke gør. Uenigheden i det svar er selve problemet.",
    boardQuestion:
      "Hvem har mandat til at træffe sportslige beslutninger, når vi er uenige?",
  },
];

export const LEVEL_CONTENT: { name: string; subtitle: string; verdict: string }[] = [
  {
    name: "Begynder",
    subtitle: "Ad-hoc drift",
    verdict:
      "Klubben holdes oppe af enkeltpersoner. Det fungerer — indtil én af dem holder op.",
  },
  {
    name: "Struktureret",
    subtitle: "Faste rammer",
    verdict: "I har rammer. De er bare ikke bundet sammen på tværs af årgange endnu.",
  },
  {
    name: "Udviklende",
    subtitle: "Sammenhængende system",
    verdict:
      "Systemet virker, når nogen holder det ved lige. Spørgsmålet er, hvad der sker, når den nogen ikke er der.",
  },
  {
    name: "Elite",
    subtitle: "Optimeret kultur",
    verdict:
      "I arbejder systematisk. Herfra handler det om at fjerne det sidste manuelle arbejde — og om at måle det, I allerede gør godt.",
  },
  {
    name: "Verdensklasse",
    subtitle: "Bæredygtigt økosystem",
    verdict:
      "Kulturen overlever udskiftninger. Det er sjældent — og det kræver vedligehold at blive ved med.",
  },
];

// ---- English mirror (used when the assessment was completed in English) ----
export const DIMENSION_CONTENT_EN: DimensionContent[] = [
  {
    key: "red_traad",
    name: "Common thread",
    shortName: "Thread",
    consequence:
      "Every time an athlete moves up an age group, development partly restarts. That typically costs half a season per transition — and it is the half season your competitors use to move ahead.",
    firstStep:
      "Write one page per age group: what should an athlete be able to do when leaving it. That is the smallest usable version of a common thread.",
    boardQuestion:
      "If we lost our three best coaches tomorrow, which age groups would be left without a plan?",
  },
  {
    key: "traenerkapacitet",
    name: "Coaching capacity",
    shortName: "Coaches",
    consequence:
      "The club's knowledge lives in individuals. The next coaching change resets what the team has built — and that change will come, however good they are today.",
    firstStep:
      "Ask each coach to write ten lines about their group that a stand-in could take over from. In one evening it reveals how much only exists in someone's head.",
    boardQuestion:
      "What does it cost us every time we train a new coach from scratch — in hours, not in money?",
  },
  {
    key: "data",
    name: "Data & documentation",
    shortName: "Data",
    consequence:
      "You cannot see whether an athlete is progressing or heading for overload until it shows up in results. By then the decision has been made for you.",
    firstStep:
      "Pick three metrics — not thirty — and track them for one group over eight weeks. The basis for decisions matters more than the volume of data.",
    boardQuestion:
      "Which three numbers will we be able to see at the next meeting, and who collects them?",
  },
  {
    key: "kultur",
    name: "Culture & retention",
    shortName: "Culture",
    consequence:
      "Drop-out is discovered in hindsight. By the time you hear about it, the decision was made weeks ago — by an athlete nobody got to talk to.",
    firstStep:
      "Count how many quit in each age group last season. Just the number. Most clubs have never done it, and it changes the boardroom conversation immediately.",
    boardQuestion:
      "How many quit last season, and what do we know about why?",
  },
  {
    key: "ledelse",
    name: "Leadership & direction",
    shortName: "Leadership",
    consequence:
      "Direction depends on who sits on the board. One annual general meeting can reset three years of work, because the direction was never anchored beyond the people.",
    firstStep:
      "Write down who makes sporting decisions and who does not. The disagreement in that answer is the actual problem.",
    boardQuestion:
      "Who has the mandate to make sporting decisions when we disagree?",
  },
];

export const LEVEL_CONTENT_EN: { name: string; subtitle: string; verdict: string }[] = [
  {
    name: "Beginner",
    subtitle: "Ad-hoc operation",
    verdict: "The club is held up by individuals. It works — until one of them stops.",
  },
  {
    name: "Structured",
    subtitle: "Fixed frameworks",
    verdict: "You have frameworks. They are just not yet connected across age groups.",
  },
  {
    name: "Developing",
    subtitle: "Coherent system",
    verdict:
      "The system works when someone maintains it. The question is what happens when that someone isn't there.",
  },
  {
    name: "Elite",
    subtitle: "Optimised culture",
    verdict:
      "You work systematically. From here it is about removing the last manual work — and measuring what you already do well.",
  },
  {
    name: "World class",
    subtitle: "Sustainable ecosystem",
    verdict: "The culture survives turnover. That is rare — and staying there takes maintenance.",
  },
];

// ---- Spørgsmål, version 2 (20 spørgsmål, 4 pr. område) ----
// Fælles kilde for klientsiden (src/data/clubAssessment.ts) og edge functions,
// så analysen kan citere klubbens faktiske spørgsmål og valgte svar.

export type QuestionContent = {
  dim: number;
  text: string;
  /** Vises i denne rækkefølge. Ved `reverse` er det BEDSTE svar først. */
  options: [string, string, string, string];
  reverse?: boolean;
};

export const QUESTION_CONTENT_V2: QuestionContent[] = [
  {
    dim: 0,
    text: "En udøver rykker fra én årgang til den næste. Hvor meget af træningsfilosofien følger med?",
    options: [
      "Det afhænger helt af, hvem den nye træner er",
      "Der er en løs fælles forståelse, intet skriftligt",
      "Der findes et skriftligt fundament, men det bruges uens",
      "Samme rammer og sprog bruges i alle årgange — og det kan ses",
    ],
  },
  {
    dim: 1,
    text: "Jeres mest erfarne træner stopper i morgen. Hvor lang tid tager det at genskabe hendes viden om holdet?",
    options: [
      "Den er tabt",
      "Måneder",
      "Uger — meget ligger i hendes hoved",
      "Dage — det væsentlige er dokumenteret",
    ],
  },
  {
    dim: 2,
    text: "Kan I redegøre for, hvordan en bestemt udøver har udviklet sig over de seneste to sæsoner?",
    options: [
      "Nej",
      "Kun ud fra resultater",
      "Delvist — hvis træneren stadig er i klubben",
      "Ja, dokumenteret og uafhængigt af trænerskift",
    ],
  },
  {
    dim: 3,
    text: "Kender I jeres frafaldsprocent pr. årgang?",
    options: [
      "Nej",
      "Vi har en fornemmelse",
      "Vi kan regne den ud bagudrettet",
      "Ja — vi følger den løbende",
    ],
  },
  {
    dim: 4,
    text: "Hvem har det sportslige ansvar på tværs af årgange?",
    options: [
      "Ingen har det entydigt",
      "Formanden, ved siden af alt andet",
      "Et udvalg med begrænset tid",
      "En defineret rolle med mandat og tid",
    ],
  },
  {
    dim: 0,
    text: "Hvor mange af jeres årgange har en sæsonplan, som en udenforstående ville kunne læse og forstå?",
    options: [
      "Ingen",
      "Enkelte hold",
      "De fleste hold",
      "Alle — og planerne hænger sammen indbyrdes",
    ],
  },
  {
    dim: 1,
    text: "Hvor ofte får trænerne struktureret sparring på deres egen praksis?",
    options: [
      "Aldrig",
      "Kun når der opstår problemer",
      "Et par gange om året",
      "Fast, flere gange pr. sæson",
    ],
  },
  {
    dim: 2,
    text: "Måler I noget systematisk om belastning, trivsel eller restitution?",
    options: [
      "Nej",
      "Vi spørger uformelt til det",
      "Enkelte hold gør det",
      "Ja — fast og på tværs af klubben",
    ],
  },
  {
    dim: 3,
    text: "Hvad sker der, når en udøver er på vej ud af klubben?",
    options: [
      "Vi opdager det, når hun er væk",
      "Træneren fanger det nogle gange",
      "Vi kontakter dem, der udebliver",
      "Vi har tidlige signaler og en fast opfølgning",
    ],
  },
  {
    dim: 4,
    text: "Har klubben en nedskrevet plan for talent- og breddearbejdet de næste tre år?",
    options: [
      "Nej",
      "Den findes i hovedet på et par stykker",
      "Ja — men den bruges sjældent",
      "Ja — og der følges op mindst årligt",
    ],
  },
  {
    dim: 0,
    text: "En ny træner overtager et hold på mandag. Hvad får hun udleveret?",
    options: [
      "Nøglen til hallen",
      "En mundtlig overlevering fra den forrige",
      "Planer og holdliste",
      "Struktureret onboarding: filosofi, planer og udøverhistorik",
    ],
  },
  {
    dim: 1,
    text: "Hvor stor en del af trænernes tid går til administration frem for træning?",
    options: [
      "Over halvdelen",
      "Cirka en tredjedel",
      "Cirka en tiendedel",
      "Meget lidt — næsten al tiden går til træning",
    ],
  },
  {
    dim: 2,
    text: "Hvad ligger til grund, når I udtager til stævner eller hold på højere niveau?",
    options: [
      "Trænerens mavefornemmelse",
      "Seneste resultater",
      "Resultater plus trænervurdering",
      "Kriterier, der er skrevet ned — og som udøverne kender",
    ],
  },
  {
    dim: 3,
    text: "Hvad vægter I reelt højest i de yngste konkurrenceårgange?",
    options: [
      "Resultater nu",
      "Resultater — men vi taler om udvikling",
      "Udvikling — men resultater styrer udtagelsen",
      "Udvikling — og det kan ses i, hvordan vi måler og udtager",
    ],
  },
  {
    dim: 4,
    text: "Bestyrelsen udskiftes ved næste generalforsamling. Hvad overlever?",
    options: [
      "Meget lidt",
      "Driften, ikke retningen",
      "Det meste — med tab af viden",
      "Alt væsentligt er forankret i organisationen",
    ],
  },
  {
    dim: 0,
    text: "Hvad sker der med sæsonplanen, når sæsonen først er i gang?",
    options: [
      "Den bliver ikke taget frem igen",
      "Den bruges løst som inspiration",
      "Den følges — men ændringer skrives ikke ned",
      "Den følges, evalueres og opdateres undervejs",
    ],
  },
  {
    dim: 1,
    text: "Hvor mange af jeres trænere har en træneruddannelse eller et aftalt forløb mod en?",
    options: [
      "Ingen",
      "Enkelte",
      "De fleste",
      "Alle — og der er en plan for næste trin",
    ],
  },
  {
    // Omvendt: bedste svar står først.
    dim: 2,
    reverse: true,
    text: "Hvor meget af det, I ved om udøverne, findes kun i private noter, regneark eller beskedtråde?",
    options: [
      "Stort set intet — det ligger ét sted, alle relevante kan tilgå",
      "En mindre del",
      "Cirka halvdelen",
      "Næsten det hele",
    ],
  },
  {
    dim: 3,
    text: "Hvor godt kender I grunden til, at de udøvere, der stoppede sidste sæson, stoppede?",
    options: [
      "Vi ved det ikke",
      "Vi har hørt et par grunde i krogene",
      "Vi kender grunden for nogle af dem",
      "Vi spørger systematisk, når nogen stopper",
    ],
  },
  {
    // Omvendt: bedste svar står først.
    dim: 4,
    reverse: true,
    text: "Hvor mange sportslige beslutninger træffes reelt af én person alene?",
    options: [
      "Stort set ingen — der er en aftalt beslutningsgang",
      "Enkelte",
      "Mange",
      "Næsten alle",
    ],
  },
];

/** Point (0-3) for et valgt svarindeks. "Ved ikke" (-1) giver 0 point. */
export function pointsForQuestion(q: QuestionContent, index: number): number {
  if (index < 0 || index > 3) return 0;
  return q.reverse ? 3 - index : index;
}

/** Moduler der faktisk findes i Sportstalent i dag. Analysen må ikke love andet. */
export const PLATFORM_MODULES: { name: string; what: string }[] = [
  { name: "Sæsonplan og rød tråd", what: "faseopdelt sæsonplan pr. hold, ugens tekniske fokus og fælles dagsskabeloner på tværs af årgange" },
  { name: "Træningsplaner og øvelsesbibliotek", what: "individuelle og holdbaserede planer, klubbens eget drill-bibliotek med video" },
  { name: "Fysiske tests", what: "faste testprotokoller, holdtestdage og udvikling over tid pr. udøver" },
  { name: "Trænings- og kampdagbog", what: "udøverens dagbog, træningslog og trænerens kommentarer" },
  { name: "Mental profil", what: "månedlig mental vurdering af udøveren og trænerens egen ledelsesvurdering" },
  { name: "Kost og vægt", what: "kostplan, madlogning og vægtmål" },
  { name: "Skadesgenoptræning", what: "faseopdelte genoptræningsforløb" },
  { name: "Videoanalyse", what: "kampvideo med tags og annotering" },
  { name: "Kalender og fremmøde", what: "klubkalender, stævner, fremmøderegistrering og skadesstatus" },
  { name: "Beskeder", what: "chat mellem trænere, udøvere og forældre, plus beskeder til forældre" },
  { name: "Spørgeskemaer", what: "trivsels- og evalueringsundersøgelser, også anonyme" },
  { name: "Rapporter", what: "månedlige udviklingsrapporter, licens- og compliancerapporter til ledelsen" },
];
