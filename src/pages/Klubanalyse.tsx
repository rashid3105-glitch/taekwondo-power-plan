import { useState, useMemo } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  QUESTIONS as QUESTIONS_DA,
  DIMENSIONS as DIMENSIONS_DA,
  LEVELS as LEVELS_DA,
  ROLES as ROLES_DA,
  MEMBER_RANGES,
  COACH_RANGES,
  QUESTIONS_VERSION,
  MAX_DIM_SCORE,
  UNKNOWN,
  computeScores,
  levelForScore,
  overallLevel,
  averageLevel,
  pointsFor,
} from "@/data/clubAssessment";
import {
  QUESTIONS_EN,
  DIMENSIONS_EN,
  LEVELS_EN,
  ROLES_EN,
  MEMBER_RANGES_EN,
  COACH_RANGES_EN,
} from "@/data/clubAssessmentEn";
import { useLanguage } from "@/i18n/LanguageContext";

// UI-tekster. Engelsk for locale "en", ellers dansk (som hidtil).
const COPY = {
  da: {
    metaTitle: "Klubanalysen — hvor står jeres klub? | Sportstalent",
    metaDesc:
      "20 spørgsmål og et ærligt billede af klubbens modenhed: rød tråd, trænerkapacitet, data, kultur og ledelse. Gratis selvevaluering for sportsklubber.",
    eyebrow: "KLUBANALYSEN",
    heroTitle: "20 spørgsmål. Ét ærligt svar på, hvor jeres klub står.",
    heroP1:
      "Analysen måler fem områder: rød tråd, trænerkapacitet, data og dokumentation, kultur og fastholdelse samt ledelse og retning. Klubbens niveau sættes af det svageste led — ikke af gennemsnittet.",
    heroP2:
      "Svar på, hvordan det er i dag. Ikke på en god dag. Er I i tvivl, så vælg \"Ved ikke\" — det er i sig selv et svar. Det tager omkring syv minutter.",
    start: "Start analysen",
    back: "← Tilbage",
    unknown: "Ved ikke",
    milestoneEyebrow: "TI SVAR AFGIVET",
    milestoneTitle: "Halvvejs.",
    milestoneP1a: "Indtil videre tegner ",
    milestoneP1b: " sig som det svageste område. Det kan nå at ændre sig — der er ti spørgsmål tilbage.",
    milestoneP2: "Der er ingen tilmelding undervejs.",
    continue: "Fortsæt",
    gateTitle: "Jeres resultat er klar.",
    gateP: "Skriv den e-mail, rapporten skal sendes til.",
    emailPlaceholder: "navn@klub.dk",
    consent: "Send mig rapporten og opfølgning på analysen. Kan afmeldes når som helst.",
    privacy: "Privatlivspolitik",
    calculating: "Beregner…",
    seeResult: "Se resultatet",
    genericError: "Noget gik galt. Prøv igen om et øjeblik.",
    blockedBy: (d: string) => `Bremset af ${d}.`,
    ceiling:
      "Niveauet sættes af det svageste led, ikke af gennemsnittet. Et område skal have mindst to lave svar for alene at sætte loftet. Det er ikke en karakter — det er et loft.",
    even: "Jeres fem områder ligger lige — ingen af dem trækker fra endnu. Løftet skal komme bredt.",
    strongestLine: (strong: string, weak: string) =>
      `${strong} står stærkest hos jer — men det tæller først for alvor, når hullet i ${weak} er lukket.`,
    average: (n: number) => `Gennemsnit på tværs af de fem områder: niveau ${n}.`,
    unknownNote: (n: number) =>
      n === 1
        ? "I svarede \"Ved ikke\" på ét spørgsmål. Det tæller som nul point — men det er selv et fund: I kan ikke styre efter noget, I ikke ved."
        : `I svarede "Ved ikke" på ${n} spørgsmål. Det tæller som nul point — men det er selv et fund: I kan ikke styre efter noget, I ikke ved.`,
    distribution: "FORDELING",
    level: "Niveau",
    gapsTitle: "De tre huller, der koster mest",
    firstStep: "FØRSTE SKRIDT",
    closingP1:
      "De tre skridt ovenfor kræver ingen software. De kræver, at nogen har tid til at gøre dem — og at det, der bliver skrevet, stadig findes om to år.",
    closingP2:
      "Det er dér, de fleste klubber løber tør. Sportstalent er bygget til at holde arbejdet i live, når ildsjælen får travlt eller stopper.",
    cta: "Book en gennemgang af jeres tre huller",
    profileTitle: "Frivilligt: fortæl lidt om jer",
    profileP: "Det hjælper os med at gøre rapporten mere præcis. Du kan springe det over.",
    clubName: "Klubnavn",
    sport: "Sportsgren",
    chooseRole: "Vælg rolle",
    chooseMembers: "Antal medlemmer",
    chooseCoaches: "Antal aktive trænere",
    saveProfile: "Gem oplysninger",
    profileSaved: "Tak — oplysningerne er gemt",
    profileFailed: "Oplysningerne kunne ikke gemmes. Det er frivilligt — din analyse er registreret.",
  },
  en: {
    metaTitle: "The Club Assessment — where does your club stand? | Sportstalent",
    metaDesc:
      "20 questions and an honest picture of your club's maturity: common thread, coaching capacity, data, culture and leadership. Free self-assessment for sports clubs.",
    eyebrow: "THE CLUB ASSESSMENT",
    heroTitle: "20 questions. One honest answer on where your club stands.",
    heroP1:
      "The assessment measures five areas: common thread, coaching capacity, data and documentation, culture and retention, and leadership and direction. The club's level is set by the weakest link — not by the average.",
    heroP2:
      "Answer for how it is today. Not on a good day. If you are unsure, choose \"Don't know\" — that is an answer in itself. It takes about seven minutes.",
    start: "Start the assessment",
    back: "← Back",
    unknown: "Don't know",
    milestoneEyebrow: "TEN ANSWERS GIVEN",
    milestoneTitle: "Halfway.",
    milestoneP1a: "So far ",
    milestoneP1b: " looks like your weakest area. That can still change — ten questions remain.",
    milestoneP2: "There is no sign-up along the way.",
    continue: "Continue",
    gateTitle: "Your result is ready.",
    gateP: "Enter the email the report should be sent to.",
    emailPlaceholder: "name@club.com",
    consent: "Send me the report and follow-up on the assessment. You can unsubscribe at any time.",
    privacy: "Privacy policy",
    calculating: "Calculating…",
    seeResult: "See the result",
    genericError: "Something went wrong. Please try again in a moment.",
    blockedBy: (d: string) => `Held back by ${d}.`,
    ceiling:
      "The level is set by the weakest link, not by the average. An area needs at least two low answers to set the ceiling on its own. It is not a grade — it is a ceiling.",
    even: "Your five areas are even — none of them stands out yet. The lift has to come broadly.",
    strongestLine: (strong: string, weak: string) =>
      `${strong} is your strongest area — but it only counts for real once the gap in ${weak} is closed.`,
    average: (n: number) => `Average across the five areas: level ${n}.`,
    unknownNote: (n: number) =>
      n === 1
        ? "You answered \"Don't know\" to one question. It counts as zero points — but it is a finding in itself: you cannot steer by something you do not know."
        : `You answered "Don't know" to ${n} questions. It counts as zero points — but it is a finding in itself: you cannot steer by something you do not know.`,
    distribution: "DISTRIBUTION",
    level: "Level",
    gapsTitle: "The three gaps that cost the most",
    firstStep: "FIRST STEP",
    closingP1:
      "The three steps above require no software. They require that someone has the time to do them — and that what gets written down still exists in two years.",
    closingP2:
      "That is where most clubs run out. Sportstalent is built to keep the work alive when the driving force gets busy or leaves.",
    cta: "Book a review of your three gaps",
    profileTitle: "Optional: tell us a little about you",
    profileP: "It helps us make the report more precise. You can skip it.",
    clubName: "Club name",
    sport: "Sport",
    chooseRole: "Select role",
    chooseMembers: "Number of members",
    chooseCoaches: "Number of active coaches",
    saveProfile: "Save details",
    profileSaved: "Thanks — your details are saved",
    profileFailed: "The details could not be saved. It is optional — your assessment is registered.",
  },
} as const;

const GOLD = "#D4AF37";
const RED = "#E05252";
const GREEN = "#4CAF7D";

type Stage = "intro" | "q" | "milestone" | "gate" | "result";

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 15,
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

export default function Klubanalyse() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const C = isEn ? COPY.en : COPY.da;
  const DIMENSIONS = isEn ? DIMENSIONS_EN : DIMENSIONS_DA;
  const QUESTIONS = isEn ? QUESTIONS_EN : QUESTIONS_DA;
  const LEVELS = isEn ? LEVELS_EN : LEVELS_DA;
  const ROLES = isEn ? ROLES_EN : ROLES_DA;
  const MEMBERS = isEn ? MEMBER_RANGES_EN : MEMBER_RANGES;
  const COACHES = isEn ? COACH_RANGES_EN : COACH_RANGES;
  const TOTAL = QUESTIONS_DA.length;
  const HALF = Math.floor(TOTAL / 2); // milepæl efter 10 svar
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(TOTAL).fill(UNKNOWN));
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  // Kortlivet profil-token. Kun i hukommelsen — aldrig i URL eller localStorage.
  const [profileToken, setProfileToken] = useState<string | null>(null);
  const [profileFailed, setProfileFailed] = useState(false);

  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [role, setRole] = useState("");
  const [memberRange, setMemberRange] = useState("");
  const [coachRange, setCoachRange] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const scores = useMemo(() => computeScores(answers), [answers]);
  const levels = scores.map(levelForScore);
  const overall = useMemo(() => overallLevel(scores, answers), [scores, answers]);
  const avgLevel = useMemo(() => averageLevel(scores), [scores]);
  const unknownCount = answers.filter((a) => a === UNKNOWN).length;
  const weakestIdx = scores.indexOf(Math.min(...scores));
  const strongestIdx = scores.indexOf(Math.max(...scores));
  const lowestThree = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, 3);

  const partialWeakest = useMemo(() => {
    const partial = [0, 0, 0, 0, 0];
    QUESTIONS_DA.slice(0, HALF).forEach((q, i) => {
      partial[q.dim] += pointsFor(q, answers[i] ?? UNKNOWN);
    });
    const answeredDims = new Set(QUESTIONS_DA.slice(0, HALF).map((q) => q.dim));
    let best = -1;
    partial.forEach((v, i) => {
      if (!answeredDims.has(i)) return;
      if (best < 0 || v < partial[best]) best = i;
    });
    return DIMENSIONS[best < 0 ? 0 : best].name;
  }, [answers, DIMENSIONS, HALF]);

  const progress = stage === "q" ? ((index + 1) / TOTAL) * 100 : stage === "intro" ? 0 : 100;

  const answer = (value: number) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (index === HALF - 1) {
      setStage("milestone");
    } else if (index === TOTAL - 1) {
      setStage("gate");
    } else {
      setIndex(index + 1);
    }
  };

  const back = () => {
    setError(null);
    if (stage === "gate") {
      setStage("q");
      setIndex(TOTAL - 1);
    } else if (stage === "milestone") {
      setStage("q");
      setIndex(HALF - 1);
    } else if (stage === "q") {
      if (index === HALF) setStage("milestone");
      else if (index === 0) setStage("intro");
      else setIndex(index - 1);
    }
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-club-assessment", {
        body: {
          action: "submit",
          email: email.trim(),
          consent,
          answers,
          scores,
          level: overall,
          weakest: DIMENSIONS_DA[weakestIdx].name,
          strongest: DIMENSIONS_DA[strongestIdx].name,
          locale: isEn ? "en" : "da",
          questions_version: QUESTIONS_VERSION,
          website,
        },
      });
      if (fnError || (data as any)?.error) throw new Error((data as any)?.error || "fejl");
      setAssessmentId((data as any)?.id ?? null);
      setProfileToken((data as any)?.token ?? null);
      setStage("result");
      window.scrollTo({ top: 0 });
    } catch {
      setError(C.genericError);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!assessmentId || !profileToken) {
      setProfileFailed(true);
      return;
    }
    setSaving(true);
    setProfileFailed(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-club-assessment", {
        body: {
          action: "profile",
          token: profileToken,
          club_name: clubName,
          sport,
          role,
          member_range: memberRange,
          coach_range: coachRange,
        },
      });
      if (fnError || (data as any)?.error) {
        // Felterne er frivillige — fejl stille, der er intet at redde.
        setProfileFailed(true);
        setProfileToken(null);
      } else {
        setProfileSaved(true);
      }
    } catch {
      setProfileFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LandingLayout>
      <PageMeta
        title={C.metaTitle}
        description={C.metaDesc}
        canonical="https://sportstalent.dk/klubanalyse"
      />

      {/* Progressbar */}
      {stage !== "intro" && stage !== "result" && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: GOLD, transition: "width .25s ease" }} />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 96px" }}>
        {stage === "intro" && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: GOLD, fontWeight: 800, marginBottom: 18 }}>
              {C.eyebrow}
            </div>
            <h1 style={{ fontSize: "clamp(28px,6vw,44px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 22px" }}>
              {C.heroTitle}
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 16px" }}>
              {C.heroP1}
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 32px" }}>
              {C.heroP2}
            </p>
            <button
              onClick={() => { setStage("q"); setIndex(0); }}
              style={{ padding: "15px 34px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            >
              {C.start}
            </button>
          </div>
        )}

        {stage === "q" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
              <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", padding: 0 }}>
                {C.back}
              </button>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
                {index + 1} / {TOTAL} · {DIMENSIONS[QUESTIONS[index].dim].name}
              </div>
            </div>
            <h2 style={{ fontSize: "clamp(21px,4.5vw,30px)", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 28px" }}>
              {QUESTIONS[index].text}
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {QUESTIONS[index].options.map((opt, i) => {
                const selected = answers[index] === i;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderRadius: 12,
                      border: `0.5px solid ${selected ? GOLD : "rgba(255,255,255,0.14)"}`,
                      background: selected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.035)",
                      color: "#fff",
                      fontSize: 15,
                      lineHeight: 1.5,
                      cursor: "pointer",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
              <button
                onClick={() => answer(UNKNOWN)}
                style={{
                  textAlign: "left",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: `0.5px dashed ${answers[index] === UNKNOWN && index < 0 ? GOLD : "rgba(255,255,255,0.18)"}`,
                  background: "transparent",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  cursor: "pointer",
                }}
              >
                {C.unknown}
              </button>
            </div>
          </div>
        )}

        {stage === "milestone" && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: GOLD, fontWeight: 800, marginBottom: 16 }}>
              {C.milestoneEyebrow}
            </div>
            <h2 style={{ fontSize: "clamp(23px,5vw,34px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              {C.milestoneTitle}
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 14px" }}>
              {C.milestoneP1a}<strong style={{ color: "#fff" }}>{partialWeakest}</strong>{C.milestoneP1b}
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", margin: "0 0 32px" }}>
              {C.milestoneP2}
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={() => { setStage("q"); setIndex(HALF); }}
                style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
              >
                {C.continue}
              </button>
              <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                {C.back}
              </button>
            </div>
          </div>
        )}

        {stage === "gate" && (
          <div>
            <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 24 }}>
              {C.back}
            </button>
            <h2 style={{ fontSize: "clamp(23px,5vw,34px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
              {C.gateTitle}
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 28px" }}>
              {C.gateP}
            </p>

            <div style={{ ...card, display: "grid", gap: 16 }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={C.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              {/* Honeypot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                aria-hidden="true"
              />
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: GOLD, flexShrink: 0 }}
                />
                <span>{C.consent}</span>
              </label>
              <a href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "underline" }}>
                {C.privacy}
              </a>
              {error && <div style={{ fontSize: 13, color: RED }}>{error}</div>}
              <button
                disabled={!email.trim() || !consent || saving}
                onClick={submit}
                style={{
                  padding: "15px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: !email.trim() || !consent || saving ? "rgba(255,255,255,0.12)" : GOLD,
                  color: !email.trim() || !consent || saving ? "rgba(255,255,255,0.4)" : "#0A0A0A",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: !email.trim() || !consent || saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? C.calculating : C.seeResult}
              </button>
            </div>
          </div>
        )}

        {stage === "result" && (
          <div style={{ display: "grid", gap: 34 }}>
            {/* 1. Niveau */}
            <div>
              <div style={{ fontSize: "clamp(64px,18vw,112px)", fontWeight: 900, lineHeight: 1, color: GOLD, letterSpacing: "-0.05em" }}>
                {overall}
              </div>
              <h1 style={{ fontSize: "clamp(26px,5.5vw,38px)", fontWeight: 900, margin: "8px 0 4px", letterSpacing: "-0.03em" }}>
                {LEVELS[overall - 1].name}
              </h1>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>{LEVELS[overall - 1].subtitle}</div>
            </div>

            {/* 2. Dom */}
            <div style={card}>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>
                {C.blockedBy(DIMENSIONS[weakestIdx].name)}
              </div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                {LEVELS[overall - 1].verdict}
              </p>
            </div>

            {/* 3. Kæde */}
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", justifyContent: "space-between" }}>
                {DIMENSIONS.map((d, i) => {
                  const isWeak = i === weakestIdx;
                  const isStrong = i === strongestIdx && strongestIdx !== weakestIdx;
                  const fill = Math.round((scores[i] / MAX_DIM_SCORE) * 100);
                  return (
                    <div key={d.key} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height: 130,
                          borderRadius: 10,
                          border: isWeak ? `2px dashed ${RED}` : "0.5px solid rgba(255,255,255,0.16)",
                          background: "rgba(255,255,255,0.04)",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: `${fill}%`,
                            background: isWeak ? "rgba(224,82,82,0.55)" : isStrong ? "rgba(76,175,125,0.55)" : "rgba(212,175,55,0.35)",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, marginTop: 8, color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>
                        {d.shortName}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. Forklaring */}
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.42)", margin: "18px 0 0" }}>
                {C.ceiling}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.42)", margin: "8px 0 0" }}>
                {C.average(avgLevel)}
              </p>
              {unknownCount > 0 && (
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.42)", margin: "8px 0 0" }}>
                  {C.unknownNote(unknownCount)}
                </p>
              )}
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.42)", margin: "8px 0 0" }}>
                {strongestIdx === weakestIdx
                  ? C.even
                  : C.strongestLine(DIMENSIONS[strongestIdx].name, DIMENSIONS[weakestIdx].name)}
              </p>
            </div>

            {/* 5. Fordeling */}
            <div>
              <h3 style={{ fontSize: 13, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", fontWeight: 800, margin: "0 0 14px" }}>
                {C.distribution}
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {DIMENSIONS.map((d, i) => (
                  <div key={d.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                      <span>{d.name}</span>
                      <span style={{ color: GOLD, fontWeight: 700 }}>{C.level} {levels[i]}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(scores[i] / MAX_DIM_SCORE) * 100}%`, background: i === weakestIdx ? RED : i === strongestIdx ? GREEN : GOLD }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Tre huller */}
            <div>
              <h3 style={{ fontSize: "clamp(20px,4.5vw,26px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                {C.gapsTitle}
              </h3>
              <div style={{ display: "grid", gap: 14 }}>
                {lowestThree.map(({ i }) => (
                  <div key={DIMENSIONS[i].key} style={card}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{DIMENSIONS[i].name}</div>
                    <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
                      {DIMENSIONS[i].consequence}
                    </p>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", color: GOLD, fontWeight: 800, marginBottom: 6 }}>
                      {C.firstStep}
                    </div>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                      {DIMENSIONS[i].firstStep}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Afslutning */}
            <div style={{ ...card, borderColor: "rgba(212,175,55,0.28)", background: "rgba(212,175,55,0.06)" }}>
              <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.8)" }}>
                {C.closingP1}
              </p>
              <p style={{ margin: "0 0 20px", fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.8)" }}>
                {C.closingP2}
              </p>
              <button
                onClick={() => navigate("/contact")}
                style={{ padding: "14px 28px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
              >
                {C.cta}
              </button>
            </div>

            {/* 8. Frivillige profilfelter */}
            <div style={card}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{C.profileTitle}</div>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                {C.profileP}
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <input placeholder={C.clubName} value={clubName} onChange={(e) => setClubName(e.target.value)} style={inputStyle} />
                <input placeholder={C.sport} value={sport} onChange={(e) => setSport(e.target.value)} style={inputStyle} />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                  <option value="">{C.chooseRole}</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ background: "#0A0A0A" }}>{r}</option>
                  ))}
                </select>
                <button
                  disabled={saving || profileSaved || !assessmentId}
                  onClick={saveProfile}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: "0.5px solid rgba(255,255,255,0.18)",
                    background: "transparent",
                    color: profileSaved ? GREEN : "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving || profileSaved ? "default" : "pointer",
                  }}
                >
                  {profileSaved ? C.profileSaved : C.saveProfile}
                </button>
                {profileFailed && !profileSaved && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {C.profileFailed}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </LandingLayout>
  );
}
