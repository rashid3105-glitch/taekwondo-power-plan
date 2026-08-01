// Klubanalysen — dansk indhold (kun DA i denne omgang; øvrige sprog vises på dansk
// indtil teksterne oversættes manuelt. Ingen maskinoversættelse.)
//
// Dimensions- og niveautekster ligger i den fælles kilde
// supabase/functions/_shared/club-assessment-content.ts, så resultatsiden og
// rapportmailen (edge function send-assessment-report) altid er identiske.

import {
  DIMENSION_CONTENT,
  LEVEL_CONTENT,
  type DimensionContent,
} from "../../supabase/functions/_shared/club-assessment-content";

export type Dimension = DimensionContent;

export const DIMENSIONS: Dimension[] = DIMENSION_CONTENT;

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

export const LEVELS = LEVEL_CONTENT;

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
