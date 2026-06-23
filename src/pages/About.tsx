import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useNavigate } from "react-router-dom";

const GOLD = "#F5C842";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

const VALUES = [
  { icon: "🥋", title: "Sport som fundament", desc: "Vi er selv aktive i sporten. Hvert eneste beslutning træffes med atleternes og coachenes hverdag i tankerne." },
  { icon: "📊", title: "Data over mavefornemmelse", desc: "De bedste coaching-beslutninger tages på baggrund af data — ikke gæt. Vi giver coaches de tal der betyder noget." },
  { icon: "🤝", title: "Coach-atlet samarbejde", desc: "Platformen er bygget til at styrke relationen mellem coach og atlet — ikke erstatte den." },
  { icon: "🏆", title: "Langsigtet udvikling", desc: "Vi tror på systematisk, periodiseret træning over tid. Ikke quick fixes. Det gælder for sport — og for os." },
];

export default function About() {
  const navigate = useNavigate();
  const aboutLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        url: "https://sportstalent.dk/about",
        name: "Om os — Sportstalent",
        description: "Historien bag Sportstalent og teamet der har bygget platformen.",
        inLanguage: "da",
      },
      {
        "@type": "Organization",
        name: "Sportstalent",
        url: "https://sportstalent.dk",
        founder: { "@type": "Person", name: "Farooq Rashid" },
        sameAs: ["https://sportstalent.dk"],
      },
      {
        "@type": "LocalBusiness",
        name: "Sportstalent",
        url: "https://sportstalent.dk",
        address: { "@type": "PostalAddress", addressLocality: "København", addressCountry: "DK" },
        identifier: "CVR 33685815",
      },
    ],
  };
  return (
    <LandingLayout>
      <PageMeta title="Om os — Sportstalent" description="Historien bag Sportstalent og teamet der har bygget platformen." canonical="https://sportstalent.dk/about" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          🥋 OM OS
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 20px", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          Bygget i en sportshal.<br /><span style={{ color: GOLD }}>Ikke på et kontor.</span>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
          Sportstalent er skabt af coaches der selv har stået med problemet: for meget administration, for lidt tid til atleter og ingen platform der forstod sportens særlige krav.
        </p>
      </section>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ ...sec, display: "grid", gridTemplateColumns: "auto 1fr", gap: 52, alignItems: "start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src="/founder-farooq.jpg" alt="Farooq Rashid" style={{ width: 210, height: 270, objectFit: "cover", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", bottom: -12, right: -12, background: "#0B0C14", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>30+</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>år i sporten</div>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>Grundlæggeren</span>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Farooq Rashid</h2>
            <div style={{ fontSize: 14, color: GOLD, fontWeight: 600, marginBottom: 22 }}>Grundlægger & Cheftræner, Copenhagen City Taekwondo</div>
            <div style={{ borderLeft: "3px solid " + GOLD, paddingLeft: 18, marginBottom: 18 }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
                "Jeg har brugt årtier som aktiv taekwondo-coach og oplevet på egen krop, hvad der mangler i moderne talentudvikling — et samlet sted til at følge, guide og løfte atleter fra begynder til verdensklasse."
              </p>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 24 }}>
              Sportstalent er ikke skabt på et kontor. Det er skabt i en sportshal, med sved på panden og atleter foran mig. Hvert eneste værktøj på platformen løser et problem jeg selv har stået med.
              <br /><br />
              Mit mål er enkelt: give enhver coach de redskaber, der gør dem i stand til at fokusere på det der virkelig betyder noget — at udvikle mennesker.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Sort bælte", "Cheftræner i 20+ år", "CPH City TKD", "CVR 33685815"].map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.22)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: GOLD }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={sec}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>Mission</span>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.1 }}>Vi løfter sporten ved at løfte de der træner den</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
            Sportstalent.dk er en dansk platform bygget specifikt til konkurrencesport. Vi tror på at de bedste coaches fortjener de bedste redskaber — og at systemer, data og teknologi skal tjene sporten, ikke omvendt.
            <br /><br />
            Vores mission er at gøre det lettere at coache godt. At give coaches tid, overblik og indsigt — så de kan fokusere på det vigtigste: at udvikle atleter.
          </p>
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>Vores værdier</span>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, letterSpacing: "-0.03em" }}>Hvad vi tror på</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", padding: "72px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>Klar til at blive en del af det?</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>Start gratis i 30 dage. Ingen kreditkort. Opsig når som helst.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/auth")} style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: GOLD, color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Start gratis →</button>
          <button onClick={() => navigate("/priser")} style={{ padding: "13px 28px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Se priser</button>
        </div>
      </div>
    </LandingLayout>
  );
}
