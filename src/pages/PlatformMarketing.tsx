import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "hsl(var(--primary))";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };
const label = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: GOLD, display: "block", marginBottom: 10 };
const h2 = { fontSize: "38px", fontWeight: 900, letterSpacing: "0", marginBottom: 14, lineHeight: 1.1 };

const BENEFIT_ICONS = ["⏱️","📊","🎯","🤝","📅","🏆"];

export default function PlatformMarketing() {
  const { t } = useLanguage();

  const BENEFITS = BENEFIT_ICONS.map((icon, i) => ({
    icon,
    title: t(`pmB${i + 1}Title`),
    desc: t(`pmB${i + 1}Desc`),
  }));

  const STEPS = [1,2,3,4].map((n) => ({
    num: t(`pmStep${n}Num`),
    title: t(`pmStep${n}Title`),
    desc: t(`pmStep${n}Desc`),
  }));

  const STATS = [
    { num: "8+", label: t("pmStat1") },
    { num: "67%", label: t("pmStat2") },
    { num: "30+", label: t("pmStat3") },
    { num: "100+", label: t("pmStat4") },
  ];

  return (
    <LandingLayout>
      <PageMeta title={`${t("navPlatform")} — Sportstalent`} description={t("pmSeoDesc")} canonical="https://sportstalent.dk/platform" />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "hsl(var(--primary) / 0.1)", border: "0.5px solid hsl(var(--primary) / 0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          🏅 {t("pmBadge")}
        </div>
        <h1 style={{ fontSize: "54px", fontWeight: 900, lineHeight: 1.07, letterSpacing: "0", margin: "0 0 20px", maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          {t("pmH1a")}<br /><span style={{ color: GOLD }}>{t("pmH1b")}</span>
        </h1>
        <p style={{ fontSize: 17, color: "hsl(var(--muted-foreground))", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
          {t("pmSub")}
        </p>
      </section>

      <div style={sec}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={label}>{t("pmBenefitsLabel")}</span>
          <h2 style={{ ...h2, textAlign: "center" }}>{t("pmBenefitsTitle")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ background: "hsl(var(--muted))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "24px 22px" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={label}>{t("pmStepsLabel")}</span>
            <h2 style={{ ...h2, textAlign: "center" }}>{t("pmStepsTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "hsl(var(--primary) / 0.15)", letterSpacing: "0", marginBottom: 8 }}>{s.num}</div>
                <div style={{ width: 32, height: 2, background: GOLD, borderRadius: 1, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sec}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 0, borderTop: "0.5px solid hsl(var(--border))", borderBottom: "0.5px solid hsl(var(--border))", padding: "40px 0" }}>
          {STATS.map((s, i, arr) => (
            <div key={i} style={{ textAlign: "center", padding: "16px", borderRight: i < arr.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, letterSpacing: "0", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", padding: "72px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "0", marginBottom: 14, lineHeight: 1.1 }}>{t("pmCtaTitle")}</h2>
        <p style={{ fontSize: 15, color: "hsl(var(--muted-foreground))", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>{t("pmCtaSub")}</p>
        <Button onClick={() => window.location.href = "/auth"} style={{ padding: "13px 32px", borderRadius: 8, border: "none", background: GOLD, color: "hsl(var(--primary-foreground))", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{t("pmCtaBtn")}</Button>
      </div>
    </LandingLayout>
  );
}
