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
