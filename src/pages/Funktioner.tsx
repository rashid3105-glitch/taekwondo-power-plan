import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#F5C842";

const MODULE_DEFS = [
  { icon: "📋", tag: "funcTagCoach", n: 1 },
  { icon: "🎥", tag: "funcTagCoachAthlete", n: 2 },
  { icon: "📊", tag: "funcTagCoachAthlete", n: 3 },
  { icon: "🏆", tag: "funcTagCoachAthlete", n: 4 },
  { icon: "🧠", tag: "funcTagCoachAthlete", n: 5 },
  { icon: "🩹", tag: "funcTagCoachAthlete", n: 6 },
  { icon: "💬", tag: "funcTagCoachAthlete", n: 7 },
  { icon: "📅", tag: "funcTagCoachCollab", n: 8 },
  { icon: "📄", tag: "funcTagCoach", n: 9 },
  { icon: "📝", tag: "funcTagAthlete", n: 10 },
];

const FEATURE_COUNTS: Record<number, number> = { 1: 4, 2: 5, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4 };

export default function Funktioner() {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const MODULES = MODULE_DEFS.map((m) => ({
    icon: m.icon,
    title: t(`fnM${m.n}Title`),
    tag: t(m.tag),
    short: t(`fnM${m.n}Short`),
    desc: t(`fnM${m.n}Desc`),
    features: Array.from({ length: FEATURE_COUNTS[m.n] }, (_, i) => t(`fnM${m.n}F${i + 1}`)),
  }));

  return (
    <LandingLayout>
      <PageMeta title={`${t("navFeatures")} — Sportstalent`} description={t("funcSeoDesc")} canonical="https://sportstalent.dk/funktioner" />

      <section style={{ padding: "56px 20px 40px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 20 }}>
          ⚡ {t("funcBadge")}
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 16px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          {t("funcH1a")}<br /><span style={{ color: GOLD }}>{t("funcH1b")}</span>
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
          {t("funcSub")}
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
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{t("funcContains")}</div>
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
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>{t("funcCtaTitle")}</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.65 }}>{t("funcCtaSub")}</p>
        <button onClick={() => window.location.href = "/auth"} style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: GOLD, color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{t("funcCtaBtn")}</button>
      </div>
    </LandingLayout>
  );
}
