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

/**
 * Version 2: 20 spørgsmål (4 pr. område), "Ved ikke" som svar og to
 * omvendt-vendte spørgsmål. Version 1 havde 15 spørgsmål (3 pr. område).
 * Gemmes på hver besvarelse, så gamle svar stadig kan vises korrekt.
 */
export const QUESTIONS_VERSION = 2;

export const UNKNOWN = -1;

export type Question = {
  dim: number;
  text: string;
  /** Vises i denne rækkefølge. Ved `reverse` er det BEDSTE svar først. */
  options: [string, string, string, string];
  reverse?: boolean;
};

/** Point (0-3) for et valgt svarindeks. "Ved ikke" giver 0 point. */
export function pointsFor(q: Question, index: number): number {
  if (index < 0 || index > 3) return 0;
  return q.reverse ? 3 - index : index;
}

// Rækkefølge Q1…Q20 — roterende mellem de fem områder, fire spørgsmål pr. område.
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

export const LEVELS = LEVEL_CONTENT;

export const ROLES = ["Formand/bestyrelse", "Sportschef", "Cheftræner", "Træner", "Andet"];

export const MEMBER_RANGES = ["Under 50", "50-149", "150-299", "300-599", "600+"];
export const COACH_RANGES = ["1-3", "4-7", "8-15", "16+"];

/** Maksimalt antal point pr. område (4 spørgsmål x 3 point). */
export const MAX_DIM_SCORE = 12;

export function levelForScore(score: number): number {
  if (score <= 1) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  if (score <= 9) return 4;
  return 5;
}

export function computeScores(answers: number[]): number[] {
  const scores = [0, 0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => {
    scores[q.dim] += pointsFor(q, answers[i] ?? UNKNOWN);
  });
  return scores;
}

/** Antal svar pr. område, hvor klubben har svaret "Ved ikke". */
export function unknownsPerDim(answers: number[]): number[] {
  const out = [0, 0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => {
    if ((answers[i] ?? UNKNOWN) === UNKNOWN) out[q.dim] += 1;
  });
  return out;
}

/** Antal svar pr. område med 0-1 point ("lave svar"). */
export function weakAnswersPerDim(answers: number[]): number[] {
  const out = [0, 0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => {
    const a = answers[i] ?? UNKNOWN;
    if (a === UNKNOWN || pointsFor(q, a) <= 1) out[q.dim] += 1;
  });
  return out;
}

/**
 * Samlet niveau. Stadig "svageste led", men et område skal have mindst to
 * lave svar for alene at kunne sætte loftet. Har intet område det, bruges det
 * næstlaveste områdeniveau, så ét enkelt uheldigt svar ikke trækker hele
 * klubben ned.
 */
export function overallLevel(scores: number[], answers: number[]): number {
  const levels = scores.map(levelForScore);
  const weak = weakAnswersPerDim(answers);
  const qualifying = levels.filter((_, i) => weak[i] >= 2);
  if (qualifying.length > 0) return Math.min(...qualifying);
  const sorted = [...levels].sort((a, b) => a - b);
  return sorted[1] ?? sorted[0];
}

/** Gennemsnitligt områdeniveau, vist ved siden af det samlede niveau. */
export function averageLevel(scores: number[]): number {
  const levels = scores.map(levelForScore);
  return Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10;
}
