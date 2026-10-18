import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "hsl(var(--primary))";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

export default function About() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();

  const VALUES = [
    { icon: "🎯", title: t("aboutV1Title"), desc: t("aboutV1Desc") },
    { icon: "📊", title: t("aboutV2Title"), desc: t("aboutV2Desc") },
    { icon: "🤝", title: t("aboutV3Title"), desc: t("aboutV3Desc") },
    { icon: "🏆", title: t("aboutV4Title"), desc: t("aboutV4Desc") },
  ];

  const aboutLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        url: "https://sportstalent.dk/about",
        name: t("aboutSeoTitle"),
        description: t("aboutSeoDesc"),
        inLanguage: locale,
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
      <PageMeta title={t("aboutSeoTitle")} description={t("aboutSeoDesc")} canonical="https://sportstalent.dk/about" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "hsl(var(--primary) / 0.1)", border: "0.5px solid hsl(var(--primary) / 0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          🏅 {t("aboutBadge")}
        </div>
        <h1 style={{ fontSize: "54px", fontWeight: 900, lineHeight: 1.07, letterSpacing: "0", margin: "0 0 20px", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          {t("aboutH1a")}<br /><span style={{ color: GOLD }}>{t("aboutH1b")}</span>
        </h1>
        <p style={{ fontSize: 17, color: "hsl(var(--muted-foreground))", lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
          {t("aboutIntro")}
        </p>
      </section>

      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div className="founder-grid" style={{ ...sec }}>
          <div style={{ position: "relative", flexShrink: 0, width: 210, maxWidth: "100%", marginBottom: 8 }}>
            <img src="/founder-farooq.jpg" alt="Farooq Rashid" style={{ width: "100%", height: 270, objectFit: "cover", borderRadius: 8, border: "0.5px solid hsl(var(--border))", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", bottom: -12, right: -12, background: "hsl(var(--primary-foreground))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>40+</div>
              <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{t("aboutFounderYears")}</div>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>{t("aboutFounderLabel")}</span>
            <h2 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "0", marginBottom: 4 }}>Farooq Rashid</h2>
            <div style={{ fontSize: 14, color: GOLD, fontWeight: 600, marginBottom: 22 }}>{t("aboutFounderRole")}</div>
            <div style={{ borderLeft: "3px solid " + GOLD, paddingLeft: 18, marginBottom: 18 }}>
              <p style={{ fontSize: 15, color: "hsl(var(--muted-foreground))", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
                {t("aboutFounderQuote")}
              </p>
            </div>
            <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", lineHeight: 1.7, marginBottom: 24 }}>
              {t("aboutFounderP2a")}
              <br /><br />
              {t("aboutFounderP2b")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[t("aboutTag1"), t("aboutTag2"), t("aboutTag3"), t("aboutTag4")].map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", background: "hsl(var(--primary) / 0.1)", border: "0.5px solid hsl(var(--primary) / 0.22)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: GOLD }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={sec}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>{t("aboutMissionLabel")}</span>
          <h2 style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "0", marginBottom: 20, lineHeight: 1.1 }}>{t("aboutMissionTitle")}</h2>
          <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", lineHeight: 1.75 }}>
            {t("aboutMissionA")}
            <br /><br />
            {t("aboutMissionB")}
          </p>
        </div>
      </div>

      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>{t("aboutValuesLabel")}</span>
            <h2 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "0" }}>{t("aboutValuesTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{ background: "hsl(var(--border))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "22px" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", padding: "72px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "0", marginBottom: 14, lineHeight: 1.1 }}>{t("aboutCtaTitle")}</h2>
        <p style={{ fontSize: 15, color: "hsl(var(--muted-foreground))", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>{t("aboutCtaSub")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/auth")} style={{ padding: "13px 28px", borderRadius: 8, border: "none", background: GOLD, color: "hsl(var(--primary-foreground))", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{t("aboutCtaPrimary")}</Button>
          <Button onClick={() => navigate("/priser")} style={{ padding: "13px 28px", borderRadius: 8, border: "0.5px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--foreground))", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t("aboutCtaSecondary")}</Button>
        </div>
      </div>
    </LandingLayout>
  );
}
