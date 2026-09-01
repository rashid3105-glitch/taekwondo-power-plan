import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { IOSDevice } from "@/components/prototypes/IOSDevice";
import "@/styles/prototypes/post-training-log-v2.css";

const TITLE = "Step 01 Prototype — Post-training log (v2, multi-coach)";
const DESC =
  "Interactive two-phone prototype of the 19:45 post-training log: an athlete logs a session, three coaches share one queue, and whoever replies first clears the row.";

const QUICK_REPLIES = [
  "Good — that timing is exactly what we drilled. Keep the same guard on Thursday.",
  "Noted. Take Thursday easy and we look at it before the session.",
];

const NOTE_TEXT = "Sparring felt sharp, but my right knee was stiff at the end.";

function effortWord(v: number) {
  if (v <= 2) return "Very easy";
  if (v <= 4) return "Easy";
  if (v <= 6) return "Moderate";
  if (v <= 8) return "Hard";
  return "Maximal";
}

const BAR_HEIGHTS = [40, 62, 0, 55, 71, 30, 0, 48, 66, 52, 0, 74, 44, 70];

const QUESTIONS: { tag: string; accent?: boolean; q: string; a: string }[] = [
  {
    tag: "Safeguarding",
    accent: true,
    q: 'A private adult-to-minor channel is the one thing to be careful with. "Coach replies privately to a 14-year-old, invisible to every other adult" is the exact pattern most child-protection policies exist to prevent — and many federations require coach-athlete communication to be visible to a second adult.',
    a: 'For under-18s, a coach\'s "private" reply means private from the parent, still visible to the other coaches. Keep fully-private replies for adult athletes. That preserves the discretion you want without creating an unobserved channel — worth checking against your national federation\'s policy before build, not after.',
  },
  {
    tag: "Wording",
    q: '"Shared" needs to name its audience. A 14-year-old reads "shared" as "the club can see this". It means the coaching staff. Never the team.',
    a: "Hence the labels in the prototype: My coaches / Only me on his side, Coaches too / Only Emil on hers. Audience, not privacy jargon.",
  },
  {
    tag: "The parent",
    q: 'Does a linked guardian sit inside "shared"? Your onboarding tells minors a parent must approve the account and can see their health data. If "shared with coaches" silently includes the parent, the label is wrong; if it excludes them, the parent\'s dashboard has a hole in it.',
    a: 'Cleanest: parents see the facts (trained, effort, attendance) and never the note, shared or not. The diary stays between athlete and coaches, which is also what makes "private" mean something to a teenager.',
  },
  {
    tag: "Accountability",
    q: '"Any coach can answer" needs a backstop. A shared queue with no owner is how an entry sits unanswered for four days while three coaches each assume another has it.',
    a: 'Add one named primary coach per athlete — not to restrict replies, but so unanswered entries escalate to someone after 48 hours, and so the "logged nothing for two weeks" nudge has an addressee.',
  },
];

type Status = "Trained" | "Partly" | "Skipped";

export default function PostTrainingLogV2() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<Status>("Trained");
  const [effort, setEffort] = useState(7);
  const [note, setNote] = useState(NOTE_TEXT);
  const [audience, setAudience] = useState<"coaches" | "me">("coaches");
  const [reply, setReply] = useState(QUICK_REPLIES[0]);
  const [coachAudience, setCoachAudience] = useState<"coaches" | "emil">("coaches");

  const reset = () => {
    setStep(1);
    setStatus("Trained");
    setEffort(7);
    setNote(NOTE_TEXT);
    setAudience("coaches");
    setReply(QUICK_REPLIES[0]);
    setCoachAudience("coaches");
  };

  return (
    <div className="ptl-v2-scope">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="ptl-wrap">
        <div className="ptl-headrow">
          <span className="ptl-kicker">Step 01 · Prototype</span>
          <span className="ptl-tracker">
            {[1, 2, 3, 4, 5].map((n, i) => (
              <span key={n}>
                <span className={n === step ? "on" : undefined}>0{n}</span>
                {i < 4 ? <span style={{ opacity: 0.4 }}> → </span> : null}
              </span>
            ))}
          </span>
        </div>
        <div className="ptl-rule" />

        <h1>Post-training log — v2 (multi-coach)</h1>
        <p className="ptl-deck">
          19:45 nudges the athlete; three coaches share one queue; whoever replies first clears the row.
        </p>

        <div className="ptl-phones">
          <div>
            <IOSDevice dark={step === 1} time={step >= 5 ? "19:53" : "19:45"}>
              <AthleteScreen
                step={step}
                status={status}
                setStatus={setStatus}
                effort={effort}
                setEffort={setEffort}
                note={note}
                setNote={setNote}
                audience={audience}
                setAudience={setAudience}
                onSend={() => setStep(3)}
                reply={reply}
              />
            </IOSDevice>
            <p className="ptl-cap">Athlete — Emil, 14</p>
          </div>

          <div>
            <IOSDevice time={step >= 5 ? "19:52" : "19:45"}>
              <CoachScreen
                step={step}
                status={status}
                effort={effort}
                note={note}
                reply={reply}
                setReply={setReply}
                coachAudience={coachAudience}
                setCoachAudience={setCoachAudience}
                onSend={() => setStep(5)}
              />
            </IOSDevice>
            <p className="ptl-cap">Coach — Sofia (of three)</p>
          </div>
        </div>

        <div className="ptl-controls">
          <button className="ptl-pill" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            ‹ Prev
          </button>
          <button className="ptl-pill solid" onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 5}>
            Next ›
          </button>
          <button className="ptl-reset" onClick={reset}>
            Reset
          </button>
        </div>

        <span className="ptl-kicker">Open questions</span>
        <table className="ptl-q">
          <thead>
            <tr>
              <td className="q">
                <span className="ptl-kicker">Question</span>
              </td>
              <td>
                <span className="ptl-kicker">My answer</span>
              </td>
            </tr>
          </thead>
          <tbody>
            {QUESTIONS.map((r) => (
              <tr key={r.tag}>
                <td className="q">
                  <span className={r.accent ? "ptl-tag accent" : "ptl-tag"}>{r.tag}</span>
                  {r.q}
                </td>
                <td className="ptl-ans">{r.a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- athlete ---------------- */

function AthleteScreen(props: {
  step: number;
  status: Status;
  setStatus: (s: Status) => void;
  effort: number;
  setEffort: (n: number) => void;
  note: string;
  setNote: (s: string) => void;
  audience: "coaches" | "me";
  setAudience: (a: "coaches" | "me") => void;
  onSend: () => void;
  reply: string;
}) {
  const { step, status, setStatus, effort, setEffort, note, setNote, audience, setAudience, onSend, reply } = props;

  if (step === 1) {
    return (
      <div className="scr lock" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
        <div style={{ textAlign: "center", color: "#f8f4f4", marginBottom: 20 }}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="#f8f4f4" style={{ opacity: 0.7 }}>
            <rect x="1" y="8" width="14" height="11" strokeWidth="1.6" />
            <path d="M4 8V5a4 4 0 0 1 8 0v3" strokeWidth="1.6" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>19:45</div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>Tuesday 3 September</div>
        </div>
        <div className="notif">
          <div className="app">Sportstalent</div>
          <div className="t">Training today?</div>
          <div className="b">Two taps. Trained · Partly · Skipped.</div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="scr">
        <div className="lbl">Log it</div>
        <div className="seg">
          {(["Trained", "Partly", "Skipped"] as Status[]).map((s) => (
            <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="lbl">Effort</span>
            <span style={{ fontWeight: 800 }}>
              {effort} · {effortWord(effort)}
            </span>
          </div>
          <input
            className="ptl-range"
            type="range"
            min={1}
            max={10}
            value={effort}
            aria-label="Effort"
            onChange={(e) => setEffort(Number(e.target.value))}
          />
          <div className="meta" style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span>1–2 Very easy</span>
            <span>3–4 Easy</span>
            <span>5–6 Moderate</span>
            <span>7–8 Hard</span>
            <span>9–10 Maximal</span>
          </div>
        </div>

        <textarea
          className="ptl-ta"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want the coaches to know?"
        />

        <div>
          <div className="lbl" style={{ marginBottom: 6 }}>
            Who sees this
          </div>
          <div className="toggle">
            <button aria-pressed={audience === "coaches"} onClick={() => setAudience("coaches")}>
              My coaches
            </button>
            <button aria-pressed={audience === "me"} onClick={() => setAudience("me")}>
              Only me
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={onSend}>
          Send
        </button>
      </div>
    );
  }

  const receipt = (
    <div className="card">
      <div style={{ fontWeight: 800 }}>
        {status} · Effort {effort} · {effortWord(effort)}
      </div>
      <div className="note" style={{ marginTop: 6 }}>
        {note}
      </div>
      <div className="meta" style={{ marginTop: 10 }}>
        {audience === "coaches" ? "Shared with Sofia, Marco and Lise" : "Only you can see this"} · 19:47
      </div>
    </div>
  );

  if (step === 3 || step === 4) {
    return (
      <div className="scr">
        <div className="lbl">Today</div>
        {receipt}
        <div className="meta">{step === 4 ? "A coach is looking at it now." : "Sent. No reply yet."}</div>
      </div>
    );
  }

  return (
    <div className="scr">
      <div className="notif" style={{ border: "1px solid var(--divider)" }}>
        <div className="app">Sportstalent</div>
        <div className="t">Sofia replied</div>
      </div>
      {receipt}
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>
          Sofia · 19:52
        </div>
        <div className="bubble">{reply}</div>
      </div>
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>
          Last 14 days
        </div>
        <div className="bars">
          {BAR_HEIGHTS.map((h, i) => (
            <i key={i} className={i === BAR_HEIGHTS.length - 1 ? "on" : undefined} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- coach ---------------- */

const PRIOR = [
  { i: "S", name: "Sofia Berg", st: "Trained", ef: 6, note: "Legs heavy after the weekend, technique fine.", t: "Yest. 20:14" },
  { i: "N", name: "Noah Dahl", st: "Partly", ef: 4, note: "Left early, school assignment.", t: "Yest. 19:58" },
  { i: "F", name: "Freja Lind", st: "Skipped", ef: 1, note: "Sick, back Thursday.", t: "Yest. 19:51" },
];

function CoachScreen(props: {
  step: number;
  status: Status;
  effort: number;
  note: string;
  reply: string;
  setReply: (s: string) => void;
  coachAudience: "coaches" | "emil";
  setCoachAudience: (a: "coaches" | "emil") => void;
  onSend: () => void;
}) {
  const { step, status, effort, note, reply, setReply, coachAudience, setCoachAudience, onSend } = props;

  const header = (
    <div>
      <div className="lbl">Shared queue</div>
      <div className="meta">Shared with you, Marco and Lise</div>
    </div>
  );

  if (step === 4) {
    return (
      <div className="scr">
        <div className="lbl">Reply · Emil H.</div>
        <div className="card">
          <div style={{ fontWeight: 800 }}>
            {status} · Effort {effort}
          </div>
          <div className="note" style={{ marginTop: 4 }}>
            {note}
          </div>
        </div>
        <div className="lbl">Quick replies</div>
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            className="ptl-pill"
            style={{ textAlign: "left", fontWeight: 500, fontSize: 12, padding: "8px 10px" }}
            onClick={() => setReply(q)}
          >
            {q}
          </button>
        ))}
        <textarea className="ptl-ta" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
        <div className="toggle">
          <button aria-pressed={coachAudience === "coaches"} onClick={() => setCoachAudience("coaches")}>
            Coaches too
          </button>
          <button aria-pressed={coachAudience === "emil"} onClick={() => setCoachAudience("emil")}>
            Only Emil
          </button>
        </div>
        <button className="btn-primary" onClick={onSend}>
          Send reply
        </button>
      </div>
    );
  }

  return (
    <div className="scr">
      {header}
      {step === 3 && (
        <QueueRow
          initial="E"
          accent
          name="Emil Hansen"
          st={status}
          ef={effort}
          note={note}
          time="19:47"
        />
      )}
      {step === 5 && (
        <QueueRow
          initial="E"
          name="Emil Hansen"
          st={status}
          ef={effort}
          note={note}
          time="Handled by Sofia · 19:52"
          handled
        />
      )}
      {PRIOR.map((p) => (
        <QueueRow key={p.name} initial={p.i} name={p.name} st={p.st} ef={p.ef} note={p.note} time={p.t} />
      ))}
      {step <= 2 && <div className="meta">Nothing new tonight.</div>}
    </div>
  );
}

function QueueRow(props: {
  initial: string;
  name: string;
  st: string;
  ef: number;
  note: string;
  time: string;
  accent?: boolean;
  handled?: boolean;
}) {
  const { initial, name, st, ef, note, time, accent, handled } = props;
  return (
    <div className={handled ? "row handled" : "row"}>
      <div className={accent ? "avatar accent" : "avatar"}>{initial}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="name">{name}</span>
          <span className={accent ? "statuspill accent" : "statuspill"}>{st}</span>
          <span className="meta">E{ef}</span>
          <span className="time">{time}</span>
        </div>
        <div className="note" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {note}
        </div>
      </div>
    </div>
  );
}
