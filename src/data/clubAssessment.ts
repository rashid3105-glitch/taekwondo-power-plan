// Klubanalysen — dansk indhold (kun DA i denne omgang; øvrige sprog vises på dansk
// indtil teksterne oversættes manuelt. Ingen maskinoversættelse.)
//
// Dimensions- og niveautekster ligger i den fælles kilde
// supabase/functions/_shared/club-assessment-content.ts, så resultatsiden og
// rapportmailen (edge function send-assessment-report) altid er identiske.

import {
  DIMENSION_CONTENT,
  LEVEL_CONTENT,
  QUESTION_CONTENT_V2,
  pointsForQuestion,
  type DimensionContent,
  type QuestionContent,
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

export type Question = QuestionContent;

/** Point (0-3) for et valgt svarindeks. "Ved ikke" giver 0 point. */
export const pointsFor = pointsForQuestion;

// Rækkefølge Q1…Q20 — roterende mellem de fem områder, fire spørgsmål pr. område.
export const QUESTIONS: Question[] = QUESTION_CONTENT_V2;

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
