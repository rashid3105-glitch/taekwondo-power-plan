import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";

const GOLD = "#F5C842";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };
const label = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: GOLD, display: "block", marginBottom: 10 };
const h2 = { fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 };

const BENEFITS = [
  { icon: "⏱️", title: "Spar 8+ timer om ugen", desc: "Automatisér tildeling af træningsplaner, påmindelser og check-ins. Brug din tid på det der virkelig tæller — dine atleter." },
  { icon: "📊", title: "Fuldt overblik på sekunder", desc: "Se hele holdets præstation, restitution og skadeshistorik i ét samlet dashboard. Ingen spredte regneark." },
  { icon: "🎯", title: "Målrettet feedback til hver atlet", desc: "Videoanalyse med noter direkte på klippet. Send tidsstemplede observationer — atleten modtager dem i sin app." },
  { icon: "🤝", title: "Styrk coach-atlet relationen", desc: "Direkte beskeder, dagbogskommentarer og check-ins holder kommunikationen tæt — uanset om du er fysisk til stede." },
  { icon: "📅", title: "Langsigtet planlægning", desc: "Kollaborativ sæsonkalender for hele klubbens coaching-team. Koordinér træningsfaser, stævner og hvileperioder." },
  { icon: "🏆", title: "Stævne-klar til enhver tid", desc: "Live nedtælling, resultater og kampoplæg samlet ét sted. Atleten møder op forberedt — du er koordineret." },
];

const STEPS = [
  { num: "01", title: "Opret din klub", desc: "Log ind, opret din klub og invitér dine atleter med ét klik. De er i gang inden for minutter." },
  { num: "02", title: "Byg din første plan", desc: "Brug vores planbuilder til at skabe et 12-ugers program med TKD-specifikke øvelser og progressive overload." },
  { num: "03", title: "Følg fremgangen", desc: "Se realtidsdata på belastning, restitution og præstation. Juster planerne løbende baseret på data." },
  { num: "04", title: "Skalér og voks", desc: "Tilføj atleter, coaches og moduler i takt med at dit hold vokser. Platformen skalerer med dig." },
];

export default function PlatformMarketing() {
  return (
    <LandingLayout>
      <PageMeta title="Platform — Sportstalent" description="Se hvordan Sportstalent gør din coaching mere effektiv, præcis og sammenhængende." canonical="https://sportstalent.dk/platform" />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          🏅 FORDELE FOR COACHES
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 20px", maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          Coaching der virker.<br /><span style={{ color: GOLD }}>Data der bekræfter det.</span>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
          Sportstalent er ikke endnu et administrationsværktøj. Det er en platform der aktivt gør dig til en bedre coach — med de rette data, på det rette tidspunkt.
        </p>
      </section>

      <div style={sec}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={label}>Hvad du vinder</span>
          <h2 style={{ ...h2, textAlign: "center" }}>Mere coaching, mindre administration</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 22px" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={label}>Sådan virker det</span>
            <h2 style={{ ...h2, textAlign: "center" }}>Fra oprettelse til fuld effekt på 30 minutter</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(245,200,66,0.15)", letterSpacing: "-0.04em", marginBottom: 8 }}>{s.num}</div>
                <div style={{ width: 32, height: 2, background: GOLD, borderRadius: 1, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sec}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 0, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)", padding: "40px 0" }}>
          {[
            { num: "8+", label: "Timer sparet om ugen" },
            { num: "67%", label: "Mere tid til coaching" },
            { num: "150+", label: "Aktive coaches" },
            { num: "2.400+", label: "Atleter på platformen" },
          ].map((s, i, arr) => (
            <div key={i} style={{ textAlign: "center", padding: "16px", borderRight: i < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", padding: "72px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>Klar til at coache smartere?</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>Start gratis i 30 dage. Ingen kreditkort. Opsig når som helst.</p>
        <button onClick={() => window.location.href = "/auth"} style={{ padding: "13px 32px", borderRadius: 10, border: "none", background: GOLD, color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage →</button>
      </div>
    </LandingLayout>
  );
}
