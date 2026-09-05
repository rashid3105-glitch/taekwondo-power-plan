// Klubanalysen — English content. Mirrors src/data/clubAssessment.ts 1:1
// (same order of dimensions, questions and options), hand-translated.

import type { Dimension, Question } from "@/data/clubAssessment";

export const DIMENSIONS_EN: Dimension[] = [
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

export const LEVELS_EN = [
  {
    name: "Beginner",
    subtitle: "Ad-hoc operation",
    verdict:
      "The club is held up by individuals. It works — until one of them stops.",
  },
  {
    name: "Structured",
    subtitle: "Fixed frameworks",
    verdict:
      "You have frameworks. They are just not yet connected across age groups.",
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
    verdict:
      "The culture survives turnover. That is rare — and staying there takes maintenance.",
  },
];

export const QUESTIONS_EN: Question[] = [
  {
    dim: 0,
    text: "An athlete moves from one age group to the next. How much of the training philosophy follows?",
    options: [
      "It depends entirely on who the new coach is",
      "There is a loose shared understanding, nothing written",
      "A written foundation exists, but it is used inconsistently",
      "The same framework and language is used in every age group — and it shows",
    ],
  },
  {
    dim: 1,
    text: "Your most experienced coach quits tomorrow. How long does it take to recreate her knowledge of the group?",
    options: [
      "It is lost",
      "Months",
      "Weeks — much of it is in her head",
      "Days — the essentials are documented",
    ],
  },
  {
    dim: 2,
    text: "Can you account for how a specific athlete has developed over the past two seasons?",
    options: [
      "No",
      "Only from results",
      "Partly — if the coach is still at the club",
      "Yes, documented and independent of coaching changes",
    ],
  },
  {
    dim: 3,
    text: "Do you know your drop-out rate per age group?",
    options: [
      "No",
      "We have a sense of it",
      "We could work it out in hindsight",
      "Yes — we track it continuously",
    ],
  },
  {
    dim: 4,
    text: "Who holds the sporting responsibility across age groups?",
    options: [
      "Nobody holds it clearly",
      "The chair, alongside everything else",
      "A committee with limited time",
      "A defined role with mandate and time",
    ],
  },
  {
    dim: 0,
    text: "How many of your age groups have a season plan an outsider could read and understand?",
    options: [
      "None",
      "A few groups",
      "Most groups",
      "All — and the plans connect to each other",
    ],
  },
  {
    dim: 1,
    text: "How often do coaches get structured feedback on their own practice?",
    options: [
      "Never",
      "Only when problems come up",
      "A couple of times a year",
      "Regularly, several times per season",
    ],
  },
  {
    dim: 2,
    text: "Do you systematically measure anything about load, wellbeing or recovery?",
    options: [
      "No",
      "We ask about it informally",
      "A few groups do",
      "Yes — consistently and across the club",
    ],
  },
  {
    dim: 3,
    text: "What happens when an athlete is on the way out of the club?",
    options: [
      "We notice once she is gone",
      "The coach catches it sometimes",
      "We contact those who stop showing up",
      "We have early signals and a fixed follow-up",
    ],
  },
  {
    dim: 4,
    text: "Does the club have a written plan for talent and grassroots work for the next three years?",
    options: [
      "No",
      "It exists in the heads of a couple of people",
      "Yes — but it is rarely used",
      "Yes — and it is reviewed at least annually",
    ],
  },
  {
    dim: 0,
    text: "A new coach takes over a group on Monday. What is she handed?",
    options: [
      "The key to the hall",
      "A verbal handover from the previous coach",
      "Plans and a team list",
      "Structured onboarding: philosophy, plans and athlete history",
    ],
  },
  {
    dim: 1,
    text: "How much of the coaches' time goes to administration rather than coaching?",
    options: [
      "More than half",
      "About a third",
      "About a tenth",
      "Very little — almost all the time goes to coaching",
    ],
  },
  {
    dim: 2,
    text: "What is the basis when you select for competitions or higher-level squads?",
    options: [
      "The coach's gut feeling",
      "Latest results",
      "Results plus coach assessment",
      "Criteria that are written down — and known by the athletes",
    ],
  },
  {
    dim: 3,
    text: "What do you actually prioritise most in the youngest competitive age groups?",
    options: [
      "Results now",
      "Results — but we talk about development",
      "Development — but results drive selection",
      "Development — and it shows in how we measure and select",
    ],
  },
  {
    dim: 4,
    text: "The board is replaced at the next general meeting. What survives?",
    options: [
      "Very little",
      "Operations, not direction",
      "Most of it — with loss of knowledge",
      "Everything essential is anchored in the organisation",
    ],
  },
  {
    dim: 0,
    text: "What happens to the season plan once the season is under way?",
    options: [
      "It is never opened again",
      "It is used loosely as inspiration",
      "It is followed — but changes are not written down",
      "It is followed, reviewed and updated along the way",
    ],
  },
  {
    dim: 1,
    text: "How many of your coaches hold a coaching qualification, or have an agreed path towards one?",
    options: [
      "None",
      "A few",
      "Most",
      "All — and there is a plan for the next step",
    ],
  },
  {
    // Reverse-coded: the best answer comes first.
    dim: 2,
    reverse: true,
    text: "How much of what you know about your athletes exists only in private notes, spreadsheets or message threads?",
    options: [
      "Almost none — it sits in one place everyone relevant can reach",
      "A smaller part",
      "About half",
      "Almost all of it",
    ],
  },
  {
    dim: 3,
    text: "How well do you know why the athletes who quit last season actually quit?",
    options: [
      "We do not know",
      "We heard a couple of reasons in passing",
      "We know the reason for some of them",
      "We ask systematically whenever someone quits",
    ],
  },
  {
    // Reverse-coded: the best answer comes first.
    dim: 4,
    reverse: true,
    text: "How many sporting decisions are in practice made by one person alone?",
    options: [
      "Almost none — there is an agreed decision process",
      "A few",
      "Many",
      "Almost all",
    ],
  },
];

export const ROLES_EN = ["Chair/board", "Sporting director", "Head coach", "Coach", "Other"];

export const MEMBER_RANGES_EN = ["Under 50", "50-149", "150-299", "300-599", "600+"];
export const COACH_RANGES_EN = ["1-3", "4-7", "8-15", "16+"];
