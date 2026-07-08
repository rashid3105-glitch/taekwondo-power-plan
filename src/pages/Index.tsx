import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { isNativeApp } from "@/lib/platform";
import { useLanguage } from "@/i18n/LanguageContext";
import coachSittingAsset from "@/assets/coach-sitting.png";
import coachStandingAsset from "@/assets/coach-standing.jpg";

const useWidth = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return w;
};

const GOLD = "#F5C842";
const BG = "#0B0C14";
const CARD = "#1F2638";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const Index = () => {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [checking, setChecking] = useState(true);
  const w = useWidth();
  const isMobile = w < 720;
  const isTablet = w >= 720 && w < 1024;
  const [promoOpen, setPromoOpen] = useState(true);
  const native = isNativeApp();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  const pad = isMobile ? 18 : 32;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Cockpit HUD ------------------------------------------------------------
  const HUD = () => (
    <div
      style={{
        background: "linear-gradient(180deg, #10121C 0%, #0B0C14 100%)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: isMobile ? 14 : 20,
        fontFamily: MONO,
        color: "rgba(255,255,255,0.85)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3ADB7C", boxShadow: "0 0 8px #3ADB7C" }} />
          {t("homeHudLive")}
        </span>
        <span>W 34 · MON</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: t("homeHudReadiness"), val: "82", unit: "/100", delta: "+4", good: true },
          { label: t("homeHudHrv"), val: "68", unit: "ms", delta: "+2", good: true },
          { label: t("homeHudLoad"), val: "412", unit: "AU", delta: "−6%", good: true },
          { label: t("homeHudMood"), val: "8.4", unit: "/10", delta: "+0.3", good: true },
        ].map((m, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{m.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{m.val}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{m.unit}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: m.good ? "#3ADB7C" : "#FF6B6B" }}>{m.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>
          <span>{t("homeHudTrainingLoad")}</span>
          <span style={{ color: GOLD }}>{t("homeHudPeak")}</span>
        </div>
        <svg viewBox="0 0 280 60" width="100%" height={isMobile ? 46 : 60} preserveAspectRatio="none">
          {[38, 52, 28, 60, 44, 48, 20, 55, 62, 40, 68, 50, 72, 46].map((h, i) => {
            const peak = i === 12;
            return (
              <rect key={i} x={i * 20 + 2} y={60 - h} width={12} height={h} rx={2}
                fill={peak ? GOLD : "rgba(255,255,255,0.55)"} opacity={peak ? 1 : 0.6} />
            );
          })}
          <line x1={0} y1={20} x2={280} y2={20} stroke="rgba(245,200,66,0.25)" strokeDasharray="2 3" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
          <span>MON 22</span><span>SUN 04</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.2)", borderRadius: 10, padding: "10px 12px" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", fontWeight: 700 }}>{t("homeHudCoach")}</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter, sans-serif" }}>{t("homeHudCoachMsg")}</span>
      </div>
    </div>
  );

  const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: MONO }}>{children}</div>
  );

  const Chapter = ({ n, label, title }: { n: string; label: string; title?: string }) => {
    if (isMobile) {
      return (
        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `26px ${pad}px 22px` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{t("homeChapterLabel")}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em" }}>/ SPORTSTALENT</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 900, color: GOLD, letterSpacing: "-0.05em", lineHeight: 0.9 }}>{n}</div>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.12)", transform: "translateY(-8px)" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", marginTop: 10, lineHeight: 1.15 }}>{label}</div>
            {title && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6, lineHeight: 1.35 }}>{title}</div>}
          </div>
        </div>
      );
    }
    return (
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `30px ${pad}px`, display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 900, color: GOLD, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0 }}>{n}</div>
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{t("homeChapterLabel")}</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: "#fff" }}>{label}</div>
            {title && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{title}</div>}
          </div>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em" }}>/ SPORTSTALENT</div>
        </div>
      </div>
    );
  };

  const featuresLabel = ({ en: "Features", da: "Funktioner", sv: "Funktioner", de: "Funktionen", ar: "الميزات", no: "Funksjoner", es: "Funciones" } as const);
  const platformLabel = ({ en: "Platform", da: "Platform", sv: "Plattform", de: "Plattform", ar: "المنصة", no: "Plattform", es: "Plataforma" } as const);
  const blogLabel = "Blog";
  
  const navItems = [
    { l: platformLabel[locale] ?? "Platform", to: "/platform" },
    { l: featuresLabel[locale] ?? "Features", to: "/funktioner" },
    { l: t("viewPricing"), to: "/priser" },
    { l: blogLabel, to: "/blog" },
    { l: t("navAbout"), to: "/about" },
  ];

  return (
    <LandingLayout>
      <div style={{ background: BG, color: "#fff", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <PageMeta
        title={t("homeSeoTitle")}
        description={t("homeSeoDesc")}
        canonical="https://sportstalent.dk/"
      />

      {promoOpen && (
        <div style={{ background: "#101322", borderBottom: "0.5px solid rgba(245,200,66,0.2)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `8px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.85)", position: "relative" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              <strong style={{ color: GOLD, letterSpacing: "0.08em", fontFamily: MONO, fontSize: 11 }}>{t("homePromoLabel")}</strong>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{t("homePromoText")}</span>
            </span>
            {!isMobile && (
              <button onClick={() => navigate("/auth?tab=signup")} style={{ background: "transparent", color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {t("homePromoCta")}
              </button>
            )}
            <button onClick={() => setPromoOpen(false)} aria-label={t("homePromoClose")} style={{ position: "absolute", right: pad, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        </div>
      )}

      <section style={{ position: "relative", padding: `${isMobile ? 40 : 72}px ${pad}px ${isMobile ? 48 : 96}px`, overflow: "hidden" }}>

        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,200,66,0.08), transparent 70%)", pointerEvents: "none" }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0, opacity: 0.35,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.05fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,200,66,0.08)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 999, padding: "5px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 22, fontFamily: MONO }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              {t("homeHeroBadge")}
            </div>
            <h1 style={{ fontSize: "clamp(34px,6.4vw,68px)", fontWeight: 900, lineHeight: 1.03, letterSpacing: "-0.045em", margin: "0 0 20px" }}>
              {t("homeHeroTitle1")}<br />
              {t("homeHeroTitle2Prefix")}<span style={{ color: GOLD, fontStyle: "italic" }}>{t("homeHeroTitle2Em")}</span>
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 520, margin: "0 0 26px" }}>
              {t("homeHeroSubtitle")}
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "grid", gap: 10 }}>
              {[t("homeHeroBullet1"), t("homeHeroBullet2"), t("homeHeroBullet3")].map((b, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <button onClick={() => navigate("/auth?tab=signup")} style={{ padding: "14px 28px", borderRadius: 10, border: "none", background: GOLD, color: BG, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 30px rgba(245,200,66,0.2)" }}>{t("homeHeroCtaStart")}</button>
              <button onClick={() => scrollTo("how-it-works")} style={{ padding: "14px 24px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.18)", background: "transparent", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t("homeHeroCtaHow")}</button>
            </div>
            <div style={{ display: "flex", gap: 18, fontSize: 12, color: "rgba(255,255,255,0.4)", flexWrap: "wrap" }}>
              {[t("homeTrust1"), t("homeTrust2"), t("homeTrust3")].map((tt, i) => (
                <span key={i} style={{ display: "inline-flex", gap: 6 }}><span style={{ color: GOLD }}>✓</span>{tt}</span>
              ))}
            </div>
          </div>

          <div>
            <HUD />
          </div>
        </div>
      </section>

      <Chapter n="01" label={t("homeCh1Label")} title={t("homeCh1Title")} />
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionEyebrow>{t("homeProblemEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.12, margin: 0 }}>
              {t("homeProblemTitlePre")}<span style={{ color: GOLD, fontStyle: "italic" }}>{t("homeProblemTitleEm")}</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "16px auto 0", lineHeight: 1.65 }}>
              {t("homeProblemSub")}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {[
              { t: t("homeProblem1T"), d: t("homeProblem1D") },
              { t: t("homeProblem2T"), d: t("homeProblem2D") },
              { t: t("homeProblem3T"), d: t("homeProblem3D") },
            ].map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 22px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", fontFamily: MONO, marginBottom: 10 }}>0{i + 1}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{p.t}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Chapter n="02" label={t("homeCh2Label")} title={t("homeCh2Title")} />
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 96}px ${pad}px` }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          <div>
            <SectionEyebrow>{t("homeSolEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 18px" }}>
              {t("homeSolTitlePre")}<span style={{ color: GOLD, fontStyle: "italic" }}>{t("homeSolTitleEm")}</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>
              {t("homeSolBody")}
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { h: t("homeSol1H"), d: t("homeSol1D") },
                { h: t("homeSol2H"), d: t("homeSol2D") },
                { h: t("homeSol3H"), d: t("homeSol3D") },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ marginTop: 4, width: 24, height: 24, borderRadius: 6, background: "rgba(245,200,66,0.12)", border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontFamily: MONO, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.h}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <img src={coachSittingAsset} alt={t("homeSolImgAlt")} style={{ width: "100%", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} />
            <div style={{ position: "absolute", bottom: -14, right: -14, background: BG, borderRadius: 10, padding: "12px 16px", border: "0.5px solid rgba(255,255,255,0.1)", fontFamily: MONO }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{t("homeSolAthletesReady")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, marginTop: 2 }}>18 / 24</div>
            </div>
          </div>
        </div>
      </section>

      <Chapter n="03" label={t("homeCh3Label")} title={t("homeCh3Title")} />
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionEyebrow>{t("homeFeatEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>{t("homeFeatTitle")}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "16px auto 0" }}>{t("homeFeatSub")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {[
              { code: "TRAIN.01", title: t("homeFeat1T"), desc: t("homeFeat1D") },
              { code: "VIDEO.02", title: t("homeFeat2T"), desc: t("homeFeat2D") },
              { code: "PERF.03", title: t("homeFeat3T"), desc: t("homeFeat3D") },
              { code: "COMP.04", title: t("homeFeat4T"), desc: t("homeFeat4D") },
              { code: "MIND.05", title: t("homeFeat5T"), desc: t("homeFeat5D") },
              { code: "REHAB.06", title: t("homeFeat6T"), desc: t("homeFeat6D") },
              { code: "CHAT.07", title: t("homeFeat7T"), desc: t("homeFeat7D") },
              { code: "REPORT.08", title: t("homeFeat8T"), desc: t("homeFeat8D") },
            ].map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: isMobile ? "18px 16px" : "22px 20px" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: "0.12em", marginBottom: 12 }}>{f.code}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Chapter n="04" label={t("homeCh4Label")} title={t("homeCh4Title")} />
      <section id="how-it-works" style={{ maxWidth: 1000, margin: "0 auto", padding: `${isMobile ? 56 : 96}px ${pad}px` }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <SectionEyebrow>{t("homeHowEyebrow")}</SectionEyebrow>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>{t("homeHowTitle")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
          {[
            { n: "01", t: t("homeHow1T"), d: t("homeHow1D") },
            { n: "02", t: t("homeHow2T"), d: t("homeHow2D") },
            { n: "03", t: t("homeHow3T"), d: t("homeHow3D") },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px 22px", position: "relative" }}>
              <div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 900, color: "rgba(245,200,66,0.15)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8, marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <Chapter n="05" label={t("homeCh5Label")} title={t("homeCh5Title")} />
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          <div style={{ position: "relative", order: isMobile ? 2 : 1 }}>
            <img src={coachStandingAsset} alt={t("homeWhyImgAlt")} style={{ width: "100%", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} />
            <div style={{ position: "absolute", bottom: -14, left: -14, background: BG, borderRadius: 10, padding: "12px 16px", border: "0.5px solid rgba(255,255,255,0.1)", fontFamily: MONO }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>67%</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{t("homeWhyStat")}</div>
            </div>
          </div>
          <div style={{ order: isMobile ? 1 : 2 }}>
            <SectionEyebrow>{t("homeWhyEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.12, marginBottom: 16 }}>
              {t("homeWhyTitleL1")}<br />{t("homeWhyTitleL2")}
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
              {t("homeWhyBody")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { t: t("homeWhy1T"), d: t("homeWhy1D") },
                { t: t("homeWhy2T"), d: t("homeWhy2D") },
                { t: t("homeWhy3T"), d: t("homeWhy3D") },
                { t: t("homeWhy4T"), d: t("homeWhy4D") },
              ].map((w2, i) => (
                <div key={i}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD }} />
                    {w2.t}
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>{w2.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, textAlign: "center" }}>
        <SectionEyebrow>{t("homeTestimonialEyebrow")}</SectionEyebrow>
        <p style={{ fontSize: "clamp(20px,2.6vw,26px)", color: "rgba(255,255,255,0.9)", lineHeight: 1.45, fontWeight: 500, letterSpacing: "-0.01em", margin: "10px 0 24px" }}>
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 36, lineHeight: 0, position: "relative", top: 8, marginRight: 4 }}>“</span>
          {t("homeTestimonialQuote")}
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 36, lineHeight: 0, position: "relative", top: 8, marginLeft: 4 }}>”</span>
        </p>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("homeTestimonialAttr")}</div>
      </section>

      <Chapter n="06" label={t("homeCh6Label")} title={t("homeCh6Title")} />
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: isMobile ? 28 : 48, alignItems: "start", justifyItems: isMobile ? "center" : "start", textAlign: isMobile ? "center" : "left" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src="/founder-farooq.jpg" alt="Farooq Rashid" style={{ width: isMobile ? 160 : 200, height: isMobile ? 210 : 260, objectFit: "cover", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", bottom: -12, right: -12, background: BG, border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: MONO }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>30+</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>{t("homeFounderYears")}</div>
            </div>
          </div>
          <div>
            <SectionEyebrow>{t("homeFounderEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Farooq Rashid</h2>
            <div style={{ fontSize: 14, color: GOLD, fontWeight: 600, marginBottom: 20, fontFamily: MONO, letterSpacing: "0.02em" }}>{t("homeFounderRole")}</div>
            <div style={{ borderLeft: isMobile ? "none" : `3px solid ${GOLD}`, paddingLeft: isMobile ? 0 : 18, marginBottom: 16 }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>“{t("homeFounderQuote")}”</p>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 22 }}>
              {t("homeFounderBody")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
              {[t("homeFounderTag1"), t("homeFounderTag2"), t("homeFounderTag3")].map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.22)", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: MONO, letterSpacing: "0.06em" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!native && <Chapter n="07" label={t("homeCh7Label")} title={t("homeCh7Title")} />}
      {!native && (
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SectionEyebrow>{t("homePriceEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>{t("homePriceTitle")}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 460, margin: "14px auto 0" }}>{t("homePriceSub")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>{t("homePriceAthleteTier")}</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>59<span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginLeft: 6 }}>{t("homePriceAthletePeriod")}</span></div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "18px 0" }} />
              {[t("homePriceAthlete1"), t("homePriceAthlete2"), t("homePriceAthlete3"), t("homePriceAthlete4")].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.14)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("homePriceAthleteCta")}</button>
            </div>
            <div style={{ background: "linear-gradient(180deg, rgba(245,200,66,0.08), rgba(245,200,66,0.03))", border: `0.5px solid rgba(245,200,66,0.35)`, borderRadius: 14, padding: "26px", position: "relative", boxShadow: "0 20px 60px rgba(245,200,66,0.08)" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GOLD, color: BG, borderRadius: 999, padding: "3px 14px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", letterSpacing: "0.1em", fontFamily: MONO }}>{t("homePriceMostPopular")}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>{t("homePriceClubTier")}</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>1299<span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginLeft: 6 }}>{t("homePriceClubPeriod")}</span></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{t("homePriceClubSeats")}</div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(245,200,66,0.15)", margin: "18px 0" }} />
              {[t("homePriceClub1"), t("homePriceClub2"), t("homePriceClub3"), t("homePriceClub4"), t("homePriceClub5"), t("homePriceClub6"), t("homePriceClub7")].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/auth?tab=signup")} style={{ width: "100%", marginTop: 18, padding: "13px", borderRadius: 8, border: "none", background: GOLD, color: BG, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{t("homePriceClubCta")}</button>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>{t("homePriceFedTier")}</div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>{t("homePriceFedPrice")}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t("homePriceFedNote")}</div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "18px 0" }} />
              {[t("homePriceFed1"), t("homePriceFed2"), t("homePriceFed3"), t("homePriceFed4"), t("homePriceFed5")].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/priser")} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.14)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("homePriceFedCta")}</button>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button onClick={() => navigate("/priser")} style={{ background: "transparent", border: "none", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO, letterSpacing: "0.08em" }}>{t("homePriceSeeAll")}</button>
          </div>
        </section>
      )}

      <Chapter n={native ? "07" : "08"} label={t("homeCh8Label")} title={t("homeCh8Title")} />
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionEyebrow>{t("homeFaqEyebrow")}</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(24px,3.6vw,34px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>{t("homeFaqTitle")}</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { q: t("homeFaq1Q"), a: t("homeFaq1A") },
              { q: t("homeFaq2Q"), a: t("homeFaq2A") },
              { q: t("homeFaq3Q"), a: t("homeFaq3A") },
              { q: t("homeFaq4Q"), a: t("homeFaq4A") },
              { q: t("homeFaq5Q"), a: t("homeFaq5A") },
              { q: t("homeFaq6Q"), a: t("homeFaq6A") },
            ].map((f, i) => (
              <details key={i} style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", cursor: "pointer" }}>
                <summary style={{ fontSize: 14, fontWeight: 700, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, color: "#fff" }}>
                  {f.q}
                  <span style={{ color: GOLD, fontFamily: MONO, fontSize: 18, lineHeight: 1 }}>+</span>
                </summary>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginTop: 10 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", padding: `${isMobile ? 64 : 100}px ${pad}px`, textAlign: "center", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,200,66,0.12), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: GOLD, fontFamily: MONO, letterSpacing: "0.14em", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
            {t("homeCtaBadge")}
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 18, lineHeight: 1.08 }}>
            {t("homeCtaTitleL1")}<br />
            <span style={{ color: GOLD, fontStyle: "italic" }}>{t("homeCtaTitleL2Em")}</span>{t("homeCtaTitleL2Post")}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.65 }}>
            {t("homeCtaBody")}
          </p>
          <button onClick={() => navigate("/auth?tab=signup")} style={{ padding: "15px 38px", borderRadius: 10, border: "none", background: GOLD, color: BG, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 15px 40px rgba(245,200,66,0.25)" }}>{t("homeCtaButton")}</button>
          <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: MONO, letterSpacing: "0.06em" }}>{t("homeCtaTrust")}</div>
        </div>
      </section>

      </div>
    </LandingLayout>

  );
};

export default Index;
