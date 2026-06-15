import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";

const GOLD = "#F5C842";

const MODULES = [
  {
    icon: "📋", title: "Træningsplanbygger", tag: "Coach",
    short: "12-ugers programmer med TKD-øvelser og periodisering.",
    desc: "Byg strukturerede 12-ugers programmer med TKD-specifikke øvelser, progressiv overload og periodisering. Gem som skabelon og tilpas per atlet på sekunder.",
    features: ["Periodisering: Anatomisk tilpasning → Intensivering → Toptræning → Deload", "Progressive overload og supersets", "Gem og genbrug skabeloner", "Ugeoversigt med dag-for-dag plan"],
  },
  {
    icon: "🎥", title: "Videoanalyse", tag: "Coach + Atlet",
    short: "Frame-by-frame analyse med tags og noter direkte på klippet.",
    desc: "Frame-by-frame scrubber med noter og tags direkte på klippet. Tidsstemplede observationer sendes til atleten i appen — al feedback samlet ét sted.",
    features: ["Frame-by-frame scrubber med tick-marks", "Tags: Teknik, Spark, Fodarbejde, Balance, Styrke, Forsvar", "Fritekst-noter per frame", "Nummererede markører på videoen", "Hastighed: 0.25× / 0.5× / 1× / 2×"],
  },
  {
    icon: "📊", title: "Fremgangsdata", tag: "Coach + Atlet",
    short: "Belastning, restitution og præstation i ét dashboard.",
    desc: "Belastningsstyring, restitutionsanalyse og præstationsstatistik samlet i ét dashboard. Spot tendenser og juster planer før problemer opstår.",
    features: ["Ugentlig belastningsgraf", "HRV og restitutionsindeks", "Præstationsstatistik over tid", "Mental præstationsscore"],
  },
  {
    icon: "🏆", title: "Stævnehåndtering", tag: "Coach + Atlet",
    short: "Live nedtælling, resultater og kampoplæg.",
    desc: "Kommende stævner med live nedtælling i dage, timer og minutter. Registrér resultater, kategorier og kampoplæg direkte i appen.",
    features: ["Live nedtælling til næste stævne", "Resultatregistrering", "Kampoplæg og kategorier", "Stævneoversigt for coach"],
  },
  {
    icon: "🧠", title: "Mental coaching", tag: "Coach + Atlet",
    short: "Check-ins og mental præstationsscore for hele holdet.",
    desc: "Mentalitetsplaner, velvære check-ins og humørregistrering for hele holdet. Fang udbrændthed og mentalt pres inden det rammer præstationen.",
    features: ["Ugentlige check-ins: træthed, humør, motivation", "Mental præstationsscore (0-30)", "Styrke- og forbedringsanalyse", "Coach-overblik over holdets velvære"],
  },
  {
    icon: "🩹", title: "Skadeopfølgning", tag: "Coach + Atlet",
    short: "Tidslinje fra skadesdag til return to play.",
    desc: "Komplet tidslinje fra skadesdag til tilbagevenden til sport. Registrér skader, milepæle og genoptræningsfremskridt — altid tilgængeligt.",
    features: ["Skadesregistrering med dato og type", "Genoptræningsmilepæle", "Tidslinje: skade → tilbagevenden", "Altid tilgængeligt — ingen adgangsbegrænsning"],
  },
  {
    icon: "💬", title: "Beskeder", tag: "Coach + Atlet",
    short: "Direkte chat og kommentarer — ingen spredte WhatsApp-tråde.",
    desc: "Direkte kommunikation mellem coach og atlet. Coach-kommentarer på dagbogsopslag og videoanalyse samlet ét sted — ingen spredte WhatsApp-tråde.",
    features: ["Direkte besked til atleter", "Kommentarer på dagbogsopslag", "Ulæst-badge i dashboard", "Notifikationer ved nye beskeder"],
  },
  {
    icon: "📅", title: "Sæsonkalender", tag: "Coach (kollaborativ)",
    short: "Fælles sæsonkalender for klubbens coaching-team.",
    desc: "Kollaborativ sæsonkalender for hele klubbens coaching-team. Alle coaches med adgang kan redigere og koordinere træningsfaser og stævner.",
    features: ["Fælles adgang for alle klubcoaches", "Træningsfaser og stævner samlet", "Ugeoversigt og månedsoverblik", "Direkte integration med træningsplaner"],
  },
  {
    icon: "📄", title: "PDF-rapporter", tag: "Coach",
    short: "Eksportér holdrapporter med ét klik.",
    desc: "Eksportér detaljerede holdpræstations-rapporter med ét tryk. Klar til forældre, forbund, bestyrelse eller sponsorer.",
    features: ["Holdstatistik som PDF", "Individuelle atletrapporter", "Eksportér med ét klik", "Professionelt layout"],
  },
  {
    icon: "📝", title: "Dagbog", tag: "Atlet",
    short: "Log noter, humør og energi — coach kan kommentere.",
    desc: "Atleten logger noter, humør og energi fra hver træning. Coach kan kommentere — en grøn prik viser ulæste coach-kommentarer i dashboardet.",
    features: ["Log noter og humør per session", "Coach-kommentarer direkte på opslag", "Grøn prik ved ulæste kommentarer", "Søgbar historik"],
  },
];

export default function Funktioner() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <LandingLayout>
      <PageMeta title="Funktioner — Sportstalent" description="Overblik over alle Sportstalent-moduler til coaches og atleter." canonical="https://sportstalent.dk/funktioner" />

      <section style={{ padding: "56px 20px 40px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 20 }}>
          ⚡ ALLE MODULER
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 16px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Alle funktioner.<br /><span style={{ color: GOLD }}>Ét sted.</span>
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
          Tryk på et modul for at se hvad det indeholder.
        </p>
      </section>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 56px", display: "flex", flexDirection: "column", gap: 10 }}>
        {MODULES.map((m, i) => {
          const open = openIdx === i;
          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `0.5px solid ${open ? "rgba(245,200,66,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                aria-expanded={open}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{m.title}</span>
                    <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.05em" }}>{m.tag.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{m.short}</div>
                </div>
                <ChevronDown
                  size={18}
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    flexShrink: 0,
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {open && (
                <div style={{ padding: "0 18px 18px 56px", borderTop: "0.5px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 14px" }}>{m.desc}</p>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Indeholder</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                    {m.features.map((f, j) => (
                      <li key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.5 }}>
                        <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>Klar til at prøve?</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.65 }}>30 dage gratis. Alle moduler inkluderet i klublicensen.</p>
        <button onClick={() => window.location.href = "/auth"} style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: GOLD, color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage →</button>
      </div>
    </LandingLayout>
  );
}
