// Klubanalysen — dansk indhold (kun DA i denne omgang; øvrige sprog vises på dansk
// indtil teksterne oversættes manuelt. Ingen maskinoversættelse.)

export type Dimension = {
  key: string;
  name: string;
  shortName: string;
  consequence: string;
  firstStep: string;
};

export const DIMENSIONS: Dimension[] = [
  {
    key: "red_traad",
    name: "Rød tråd",
    shortName: "Rød tråd",
    consequence:
      "Hver gang en udøver skifter årgang, starter udviklingen delvist forfra. Det koster typisk en halv sæson pr. skifte — og det er den halve sæson, konkurrenterne bruger på at rykke.",
    firstStep:
      "Skriv ét A4 pr. årgang: hvad skal en udøver kunne, når hun forlader den. Det er den mindste brugbare version af en rød tråd.",
  },
  {
    key: "traenerkapacitet",
    name: "Trænerkapacitet",
    shortName: "Trænere",
    consequence:
      "Klubbens viden bor i enkeltpersoner. Næste trænerudskiftning nulstiller det, holdet har bygget op — og den udskiftning kommer, uanset hvor gode de er nu.",
    firstStep:
      "Bed hver træner skrive ti linjer om sit hold, som en afløser kunne overtage på. Det afdækker på en aften, hvor meget der kun findes i hovedet.",
  },
  {
    key: "data",
    name: "Data & dokumentation",
    shortName: "Data",
    consequence:
      "I kan ikke se, om en udøver er i fremgang eller på vej mod overbelastning, før det viser sig i resultaterne. På det tidspunkt er beslutningen truffet for jer.",
    firstStep:
      "Vælg tre parametre — ikke tredive — og mål dem på ét hold i otte uger. Beslutningsgrundlaget er vigtigere end datamængden.",
  },
  {
    key: "kultur",
    name: "Kultur & fastholdelse",
    shortName: "Kultur",
    consequence:
      "Frafald opdages bagudrettet. Når I hører om det, blev beslutningen truffet for uger siden — af en udøver, ingen nåede at tale med.",
    firstStep:
      "Tæl, hvor mange der stoppede i hver årgang sidste sæson. Bare tallet. De fleste klubber har aldrig gjort det, og det flytter samtalen i bestyrelsen med det samme.",
  },
  {
    key: "ledelse",
    name: "Ledelse & retning",
    shortName: "Ledelse",
    consequence:
      "Retningen afhænger af, hvem der sidder i bestyrelsen. Én generalforsamling kan nulstille tre års arbejde, fordi retningen aldrig blev forankret uden for personerne.",
    firstStep:
      "Skriv ned, hvem der træffer sportslige beslutninger, og hvem der ikke gør. Uenigheden i det svar er selve problemet.",
  },
];

export type Question = { dim: number; text: string; options: [string, string, string, string] };

// Rækkefølge Q1…Q15 — roterende mellem dimensionerne.
export const QUESTIONS: Question[] = [
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
      "Begrænset — men vi har aldrig målt det",
      "Lidt — og vi ved det, fordi vi har set på det",
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
];

export const LEVELS: { name: string; subtitle: string; verdict: string }[] = [
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

export const ROLES = ["Formand/bestyrelse", "Sportschef", "Cheftræner", "Træner", "Andet"];

export function levelForScore(score: number): number {
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 5) return 3;
  if (score <= 7) return 4;
  return 5;
}

export function computeScores(answers: number[]): number[] {
  const scores = [0, 0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => {
    scores[q.dim] += answers[i] ?? 0;
  });
  return scores;
}
