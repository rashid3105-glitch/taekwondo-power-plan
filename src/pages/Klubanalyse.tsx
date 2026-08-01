import { useState, useMemo } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  QUESTIONS,
  DIMENSIONS,
  LEVELS,
  ROLES,
  computeScores,
  levelForScore,
} from "@/data/clubAssessment";

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
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(15).fill(-1));
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
  const [profileSaved, setProfileSaved] = useState(false);

  const scores = useMemo(() => computeScores(answers.map((a) => (a < 0 ? 0 : a))), [answers]);
  const levels = scores.map(levelForScore);
  const overall = Math.min(...levels);
  const weakestIdx = scores.indexOf(Math.min(...scores));
  const strongestIdx = scores.indexOf(Math.max(...scores));
  const lowestThree = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, 3);

  const partialWeakest = useMemo(() => {
    const partial = [0, 0, 0, 0, 0];
    QUESTIONS.slice(0, 8).forEach((q, i) => {
      partial[q.dim] += Math.max(0, answers[i]);
    });
    // Kun dimensioner der har fået mindst ét svar
    const answeredDims = new Set(QUESTIONS.slice(0, 8).map((q) => q.dim));
    let best = -1;
    partial.forEach((v, i) => {
      if (!answeredDims.has(i)) return;
      if (best < 0 || v < partial[best]) best = i;
    });
    return DIMENSIONS[best < 0 ? 0 : best].name;
  }, [answers]);

  const progress = stage === "q" ? ((index + 1) / 15) * 100 : stage === "intro" ? 0 : 100;

  const answer = (value: number) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (index === 7) {
      setStage("milestone");
    } else if (index === 14) {
      setStage("gate");
    } else {
      setIndex(index + 1);
    }
  };

  const back = () => {
    setError(null);
    if (stage === "gate") {
      setStage("q");
      setIndex(14);
    } else if (stage === "milestone") {
      setStage("q");
      setIndex(7);
    } else if (stage === "q") {
      if (index === 8) setStage("milestone");
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
          answers: answers.map((a) => Math.max(0, a)),
          scores,
          level: overall,
          weakest: DIMENSIONS[weakestIdx].name,
          strongest: DIMENSIONS[strongestIdx].name,
          website,
        },
      });
      if (fnError || (data as any)?.error) throw new Error((data as any)?.error || "fejl");
      setAssessmentId((data as any)?.id ?? null);
      setProfileToken((data as any)?.token ?? null);
      setStage("result");
      window.scrollTo({ top: 0 });
    } catch {
      setError("Noget gik galt. Prøv igen om et øjeblik.");
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
        body: { action: "profile", token: profileToken, club_name: clubName, sport, role },
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
        title="Klubanalysen — hvor står jeres klub? | Sportstalent"
        description="15 spørgsmål og et ærligt billede af klubbens modenhed: rød tråd, trænerkapacitet, data, kultur og ledelse. Gratis selvevaluering for sportsklubber."
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
              KLUBANALYSEN
            </div>
            <h1 style={{ fontSize: "clamp(28px,6vw,44px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 22px" }}>
              15 spørgsmål. Ét ærligt svar på, hvor jeres klub står.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 16px" }}>
              Analysen måler fem områder: rød tråd, trænerkapacitet, data og dokumentation, kultur og fastholdelse
              samt ledelse og retning. Klubbens niveau sættes af det svageste led — ikke af gennemsnittet.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 32px" }}>
              Svar på, hvordan det er i dag. Ikke på en god dag. Det tager omkring fem minutter.
            </p>
            <button
              onClick={() => { setStage("q"); setIndex(0); }}
              style={{ padding: "15px 34px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            >
              Start analysen
            </button>
          </div>
        )}

        {stage === "q" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
              <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", padding: 0 }}>
                ← Tilbage
              </button>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
                {index + 1} / 15 · {DIMENSIONS[QUESTIONS[index].dim].name}
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
            </div>
          </div>
        )}

        {stage === "milestone" && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: GOLD, fontWeight: 800, marginBottom: 16 }}>
              OTTE SVAR AFGIVET
            </div>
            <h2 style={{ fontSize: "clamp(23px,5vw,34px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              Godt halvvejs.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 14px" }}>
              Indtil videre tegner <strong style={{ color: "#fff" }}>{partialWeakest}</strong> sig som det svageste område.
              Det kan nå at ændre sig — der er syv spørgsmål tilbage.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", margin: "0 0 32px" }}>
              Der er ingen tilmelding undervejs.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={() => { setStage("q"); setIndex(8); }}
                style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
              >
                Fortsæt
              </button>
              <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                ← Tilbage
              </button>
            </div>
          </div>
        )}

        {stage === "gate" && (
          <div>
            <button onClick={back} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 24 }}>
              ← Tilbage
            </button>
            <h2 style={{ fontSize: "clamp(23px,5vw,34px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
              Jeres resultat er klar.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 28px" }}>
              Skriv den e-mail, rapporten skal sendes til.
            </p>

            <div style={{ ...card, display: "grid", gap: 16 }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="navn@klub.dk"
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
                <span>Send mig rapporten og opfølgning på analysen. Kan afmeldes når som helst.</span>
              </label>
              <a href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "underline" }}>
                Privatlivspolitik
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
                {saving ? "Beregner…" : "Se resultatet"}
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
                Bremset af {DIMENSIONS[weakestIdx].name}.
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
                  const fill = Math.round((scores[i] / 9) * 100);
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
                Niveauet sættes af det svageste led, ikke af gennemsnittet. Det er ikke en karakter — det er et loft.
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.42)", margin: "8px 0 0" }}>
                {strongestIdx === weakestIdx
                  ? "Jeres fem områder ligger lige — ingen af dem trækker fra endnu. Løftet skal komme bredt."
                  : `${DIMENSIONS[strongestIdx].name} står stærkest hos jer — men det tæller først for alvor, når hullet i ${DIMENSIONS[weakestIdx].name} er lukket.`}
              </p>
            </div>

            {/* 5. Fordeling */}
            <div>
              <h3 style={{ fontSize: 13, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", fontWeight: 800, margin: "0 0 14px" }}>
                FORDELING
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {DIMENSIONS.map((d, i) => (
                  <div key={d.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                      <span>{d.name}</span>
                      <span style={{ color: GOLD, fontWeight: 700 }}>Niveau {levels[i]}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(scores[i] / 9) * 100}%`, background: i === weakestIdx ? RED : i === strongestIdx ? GREEN : GOLD }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Tre huller */}
            <div>
              <h3 style={{ fontSize: "clamp(20px,4.5vw,26px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                De tre huller, der koster mest
              </h3>
              <div style={{ display: "grid", gap: 14 }}>
                {lowestThree.map(({ i }) => (
                  <div key={DIMENSIONS[i].key} style={card}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{DIMENSIONS[i].name}</div>
                    <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
                      {DIMENSIONS[i].consequence}
                    </p>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", color: GOLD, fontWeight: 800, marginBottom: 6 }}>
                      FØRSTE SKRIDT
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
                De tre skridt ovenfor kræver ingen software. De kræver, at nogen har tid til at gøre dem — og at det,
                der bliver skrevet, stadig findes om to år.
              </p>
              <p style={{ margin: "0 0 20px", fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.8)" }}>
                Det er dér, de fleste klubber løber tør. Sportstalent er bygget til at holde arbejdet i live, når
                ildsjælen får travlt eller stopper.
              </p>
              <button
                onClick={() => navigate("/contact")}
                style={{ padding: "14px 28px", borderRadius: 10, border: "none", background: GOLD, color: "#0A0A0A", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
              >
                Book en gennemgang af jeres tre huller
              </button>
            </div>

            {/* 8. Frivillige profilfelter */}
            <div style={card}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Frivilligt: fortæl lidt om jer</div>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Det hjælper os med at gøre rapporten mere præcis. Du kan springe det over.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <input placeholder="Klubnavn" value={clubName} onChange={(e) => setClubName(e.target.value)} style={inputStyle} />
                <input placeholder="Sportsgren" value={sport} onChange={(e) => setSport(e.target.value)} style={inputStyle} />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                  <option value="">Vælg rolle</option>
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
                  {profileSaved ? "Tak — oplysningerne er gemt" : "Gem oplysninger"}
                </button>
                {profileFailed && !profileSaved && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    Oplysningerne kunne ikke gemmes. Det er frivilligt — din analyse er registreret.
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
