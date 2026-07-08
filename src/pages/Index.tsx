import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { isNativeApp } from "@/lib/platform";
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
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3ADB7C", boxShadow: "0 0 8px #3ADB7C" }} />
          Athlete cockpit · live
        </span>
        <span>W 34 · MON</span>
      </div>

      {/* top row: 4 metrics */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Readiness", val: "82", unit: "/100", delta: "+4", good: true },
          { label: "HRV rmssd", val: "68", unit: "ms", delta: "+2", good: true },
          { label: "Load 7d", val: "412", unit: "AU", delta: "−6%", good: true },
          { label: "Mood", val: "8.4", unit: "/10", delta: "+0.3", good: true },
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

      {/* Load bar chart */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>
          <span>Training load · 14 days</span>
          <span style={{ color: GOLD }}>PEAK PHASE</span>
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

      {/* Coach note stripe */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.2)", borderRadius: 10, padding: "10px 12px" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", fontWeight: 700 }}>Coach</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter, sans-serif" }}>Sænk intensiteten i morgen. Fokus på teknik og restitution.</span>
      </div>
    </div>
  );

  // Section shells ---------------------------------------------------------
  const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: MONO }}>{children}</div>
  );

  const Chapter = ({ n, label, title }: { n: string; label: string; title?: string }) => (
    <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: `${isMobile ? 22 : 30}px ${pad}px`, display: "flex", alignItems: "center", gap: isMobile ? 16 : 28 }}>
        <div style={{ fontFamily: MONO, fontSize: isMobile ? 36 : 56, fontWeight: 900, color: GOLD, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0 }}>{n}</div>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Chapter</div>
          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, letterSpacing: "-0.01em", color: "#fff" }}>{label}</div>
          {title && !isMobile && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{title}</div>}
        </div>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", display: isMobile ? "none" : "block" }}>/ SPORTSTALENT</div>
      </div>
    </div>
  );



  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <PageMeta
        title="Sportstalent — Platformen til sportscoaches"
        description="Træningsplaner, videoanalyse, mental coaching og atletdata samlet i ét cockpit. Bygget af coaches, til coaches."
        canonical="https://sportstalent.dk/"
      />

      {/* PROMO BAR */}
      {promoOpen && (
        <div style={{ background: "#101322", borderBottom: "0.5px solid rgba(245,200,66,0.2)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `8px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.85)", position: "relative" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              <strong style={{ color: GOLD, letterSpacing: "0.08em", fontFamily: MONO, fontSize: 11 }}>BETA ÅBEN</strong>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Få 2 måneder gratis når du opretter din klub</span>
            </span>
            {!isMobile && (
              <button onClick={() => navigate("/auth?tab=signup")} style={{ background: "transparent", color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Kom med →
              </button>
            )}
            <button onClick={() => setPromoOpen(false)} aria-label="Luk" style={{ position: "absolute", right: pad, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(11,12,20,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <nav style={{ padding: `0 ${pad}px`, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <BrandLogo height={isMobile ? 36 : 44} onClick={() => navigate("/")} />
          {!isMobile && (
            <div style={{ display: "flex", gap: isTablet ? 14 : 24, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
              {[
                { l: "Platform", to: "/platform" },
                { l: "Funktioner", to: "/funktioner" },
                { l: "Priser", to: "/priser" },
                { l: "Blog", to: "/blog" },
                { l: "Om os", to: "/about" },
              ].map(({ l, to }) => (
                <span key={l} onClick={() => navigate(to)} style={{ cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: isMobile ? 6 : 10, alignItems: "center" }}>
            <LanguageSwitcher />
            <button onClick={() => navigate("/auth")} style={{ padding: isMobile ? "7px 14px" : "8px 18px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.14)", background: "transparent", color: "#fff", fontSize: isMobile ? 13 : 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Log ind</button>
            {!isMobile && (
              <button onClick={() => navigate("/auth?tab=signup")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: GOLD, color: BG, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Prøv gratis →</button>
            )}
          </div>
        </nav>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", gap: 18, padding: "8px 12px 10px", fontSize: 12, color: "rgba(255,255,255,0.7)", borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
            {[
              { l: "Platform", to: "/platform" },
              { l: "Funktioner", to: "/funktioner" },
              { l: "Priser", to: "/priser" },
              { l: "Blog", to: "/blog" },
              { l: "Om os", to: "/about" },
            ].map(({ l, to }) => (
              <span key={l} onClick={() => navigate(to)} style={{ cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        )}
      </header>

      <main>
      {/* HERO --------------------------------------------------------------- */}
      <section style={{ position: "relative", padding: `${isMobile ? 40 : 72}px ${pad}px ${isMobile ? 48 : 96}px`, overflow: "hidden" }}>
        {/* subtle grid backdrop */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,200,66,0.08), transparent 70%)",
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0, opacity: 0.35,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.05fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          {/* LEFT: copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,200,66,0.08)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 999, padding: "5px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 22, fontFamily: MONO }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              SYSTEM V1.0 · ACTIVE
            </div>
            <h1 style={{ fontSize: "clamp(34px,6.4vw,68px)", fontWeight: 900, lineHeight: 1.03, letterSpacing: "-0.045em", margin: "0 0 20px" }}>
              Hæv dit niveau.<br />
              Træn med <span style={{ color: GOLD, fontStyle: "italic" }}>præcision.</span>
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 520, margin: "0 0 26px" }}>
              Sportstalent samler træningsplaner, videoanalyse, mental coaching og atletdata i ét cockpit — bygget af coaches, til coaches.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "grid", gap: 10 }}>
              {[
                "Bliv mere konsistent under pres",
                "Se restitution, form og skader — på tværs af holdet",
                "Reducer administration og få mere tid på gulvet",
              ].map((b, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <button onClick={() => navigate("/auth?tab=signup")} style={{ padding: "14px 28px", borderRadius: 10, border: "none", background: GOLD, color: BG, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 30px rgba(245,200,66,0.2)" }}>Start gratis →</button>
              <button onClick={() => scrollTo("how-it-works")} style={{ padding: "14px 24px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.18)", background: "transparent", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Se hvordan det virker</button>
            </div>
            <div style={{ display: "flex", gap: 18, fontSize: 12, color: "rgba(255,255,255,0.4)", flexWrap: "wrap" }}>
              {["30 dage gratis", "Intet kreditkort", "Opsig når som helst"].map((t, i) => (
                <span key={i} style={{ display: "inline-flex", gap: 6 }}><span style={{ color: GOLD }}>✓</span>{t}</span>
              ))}
            </div>
          </div>

          {/* RIGHT: cockpit HUD */}
          <div>
            <HUD />
          </div>
        </div>
      </section>

      <Chapter n="01" label="Problemet" title="Hvorfor de fleste coaches står i stampe" />
      {/* PROBLEM ------------------------------------------------------------ */}
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionEyebrow>Problemet</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.12, margin: 0 }}>
              De fleste coaches drukner i <span style={{ color: GOLD, fontStyle: "italic" }}>administration</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "16px auto 0", lineHeight: 1.65 }}>
              Regneark, WhatsApp, spredte noter, tre forskellige apps — og alligevel mangler du overblikket, når det gælder.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {[
              { t: "Ingen samlet oversigt", d: "Data om atleter lever i regneark, chats og hukommelse. Beslutninger tages på mavefornemmelse." },
              { t: "Spildt træningstid", d: "Bruger timer på at opdatere planer og finde noter — i stedet for at coache foran holdet." },
              { t: "Plateau i udvikling", d: "Uden objektive tal på belastning, form og mental tilstand er det svært at se hvor progressionen bremser." },
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

      <Chapter n="02" label="Løsningen" title="Ét cockpit, én kilde til sandheden" />
      {/* SOLUTION ----------------------------------------------------------- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 96}px ${pad}px` }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          <div>
            <SectionEyebrow>Løsningen</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 18px" }}>
              Data slår <span style={{ color: GOLD, fontStyle: "italic" }}>mavefornemmelse</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>
              Sportstalent giver dig en objektiv, altid opdateret oversigt over hver atlet — belastning, restitution, mental tilstand, skader og træningskvalitet — samlet ét sted.
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { h: "Én kilde til sandheden", d: "Alle data om hver atlet i samme cockpit — synkront på tværs af coach og atlet." },
                { h: "Beslutninger på fakta", d: "Se hvem der er klar til belastning, og hvem der har brug for pause — inden skaden sker." },
                { h: "Automatiseret rapportering", d: "Månedlige udviklingsrapporter genereres for dig. Del med atleten, forældre eller forbund." },
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
            <img src={coachSittingAsset} alt="Coach analyserer atletdata" style={{ width: "100%", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} />
            <div style={{ position: "absolute", bottom: -14, right: -14, background: BG, borderRadius: 10, padding: "12px 16px", border: "0.5px solid rgba(255,255,255,0.1)", fontFamily: MONO }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Athletes ready</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, marginTop: 2 }}>18 / 24</div>
            </div>
          </div>
        </div>
      </section>

      <Chapter n="03" label="Platformen" title="Alt hvad du behøver som sportscoach" />
      {/* FEATURES ----------------------------------------------------------- */}
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionEyebrow>Platformen</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>Alt hvad du behøver, samlet ét sted</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "16px auto 0" }}>Én platform erstatter regneark, beskedapps og spredte noter.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {[
              { code: "TRAIN.01", title: "Træningsplaner", desc: "Periodiserede programmer med progressive overload og fasestyring." },
              { code: "VIDEO.02", title: "Videoanalyse", desc: "Frame-by-frame scrubber med tags, noter og deling." },
              { code: "PERF.03", title: "Fremgangsdata", desc: "Belastning, form, restitution — hele holdet på ét dashboard." },
              { code: "COMP.04", title: "Stævner", desc: "Nedtælling, refleksioner og resultater samlet pr. atlet." },
              { code: "MIND.05", title: "Mental coaching", desc: "Check-ins, humørsporing og månedlige mentale rapporter." },
              { code: "REHAB.06", title: "Skadeopfølgning", desc: "Fra skadedag til return-to-play med fasede rehab-planer." },
              { code: "CHAT.07", title: "Beskeder", desc: "1:1 og gruppe-chat med atleter og forældre." },
              { code: "REPORT.08", title: "PDF-rapporter", desc: "Månedlige udviklingsrapporter genereret automatisk." },
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

      <Chapter n="04" label="Sådan virker det" title="Op at køre på under en time" />
      {/* HOW IT WORKS ------------------------------------------------------- */}
      <section id="how-it-works" style={{ maxWidth: 1000, margin: "0 auto", padding: `${isMobile ? 56 : 96}px ${pad}px` }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <SectionEyebrow>Sådan kommer du i gang</SectionEyebrow>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>Op at køre på under en time</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
          {[
            { n: "01", t: "Opret din klub", d: "Signup tager 2 minutter. Vælg dit sportssystem og lav klubbens grunddata." },
            { n: "02", t: "Invitér atleter", d: "Del en invitationskode. Atleter opretter selv deres profil og udfylder onboarding." },
            { n: "03", t: "Følg udviklingen", d: "Se cockpittet fyldes med data. Grib ind hvor og hvornår det er nødvendigt." },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px 22px", position: "relative" }}>
              <div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 900, color: "rgba(245,200,66,0.15)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8, marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <Chapter n="05" label="Hvorfor Sportstalent" title="Bygget af coaches. For coaches." />
      {/* WHY / COACH SPLIT -------------------------------------------------- */}
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
          <div style={{ position: "relative", order: isMobile ? 2 : 1 }}>
            <img src={coachStandingAsset} alt="Coach i sportshallen" style={{ width: "100%", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} />
            <div style={{ position: "absolute", bottom: -14, left: -14, background: BG, borderRadius: 10, padding: "12px 16px", border: "0.5px solid rgba(255,255,255,0.1)", fontFamily: MONO }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>67%</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>Mere tid til coaching</div>
            </div>
          </div>
          <div style={{ order: isMobile ? 1 : 2 }}>
            <SectionEyebrow>Hvorfor Sportstalent</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.12, marginBottom: 16 }}>
              Bygget af coaches.<br />For coaches.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
              Hver funktion er født i sportshallen — ikke på et kontor. Vi løser reelle problemer, du som træner møder hver uge.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { t: "Bygget til sport", d: "Kamp, teknik og stævner — ikke generisk fitness." },
                { t: "App til atleter", d: "Plan, kalender og coach-kontakt i lommen." },
                { t: "Spar 8+ timer/uge", d: "Automatisér opfølgning og rapportering." },
                { t: "Coach-samarbejde", d: "Del planer og kalender på tværs af hold." },
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

      {/* TESTIMONIAL -------------------------------------------------------- */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, textAlign: "center" }}>
        <SectionEyebrow>Coaches siger</SectionEyebrow>
        <p style={{ fontSize: "clamp(20px,2.6vw,26px)", color: "rgba(255,255,255,0.9)", lineHeight: 1.45, fontWeight: 500, letterSpacing: "-0.01em", margin: "10px 0 24px" }}>
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 36, lineHeight: 0, position: "relative", top: 8, marginRight: 4 }}>“</span>
          Sportstalent har halveret min tid på administration. Den tid bruger jeg på atleterne i stedet.
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 36, lineHeight: 0, position: "relative", top: 8, marginLeft: 4 }}>”</span>
        </p>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Coach på platformen · Beta-tester</div>
      </section>

      <Chapter n="06" label="Grundlæggeren" title="Skabt i sportshallen — ikke på et kontor" />
      {/* FOUNDER ------------------------------------------------------------ */}
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: isMobile ? 28 : 48, alignItems: "start", justifyItems: isMobile ? "center" : "start", textAlign: isMobile ? "center" : "left" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src="/founder-farooq.jpg" alt="Farooq Rashid" style={{ width: isMobile ? 160 : 200, height: isMobile ? 210 : 260, objectFit: "cover", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", bottom: -12, right: -12, background: BG, border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: MONO }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>30+</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>år i sporten</div>
            </div>
          </div>
          <div>
            <SectionEyebrow>Grundlæggeren</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Farooq Rashid</h2>
            <div style={{ fontSize: 14, color: GOLD, fontWeight: 600, marginBottom: 20, fontFamily: MONO, letterSpacing: "0.02em" }}>Grundlægger & Cheftræner · Copenhagen City Taekwondo</div>
            <div style={{ borderLeft: isMobile ? "none" : `3px solid ${GOLD}`, paddingLeft: isMobile ? 0 : 18, marginBottom: 16 }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>“Jeg har brugt årtier som aktiv coach og oplevet på egen krop, hvad der mangler i moderne talentudvikling — et samlet sted til at følge, guide og løfte atleter fra begynder til verdensklasse.”</p>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 22 }}>
              Sportstalent er ikke skabt på et kontor. Det er skabt i en sportshal, med sved på panden og atleter foran mig. Hvert eneste værktøj på platformen løser et problem jeg selv har stået med.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
              {["Sort bælte", "Cheftræner 20+ år", "Copenhagen City TKD"].map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.22)", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: MONO, letterSpacing: "0.06em" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!native && <Chapter n="07" label="Priser" title="Simpel, transparent prissætning" />}
      {/* PRICING TEASER ----------------------------------------------------- */}
      {!native && (
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SectionEyebrow>Priser</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.035em", margin: 0 }}>Simpel, transparent prissætning</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 460, margin: "14px auto 0" }}>Start gratis. Opgradér når holdet vokser.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
            {/* Atlet */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>Atlet</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>59<span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginLeft: 6 }}>DKK/md</span></div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "18px 0" }} />
              {["Personlig træningsplan", "Stævneoversigt", "Beskeder fra coach", "Fremgangsstatistik"].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.14)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Kom i gang</button>
            </div>
            {/* Klub — featured */}
            <div style={{ background: "linear-gradient(180deg, rgba(245,200,66,0.08), rgba(245,200,66,0.03))", border: `0.5px solid rgba(245,200,66,0.35)`, borderRadius: 14, padding: "26px", position: "relative", boxShadow: "0 20px 60px rgba(245,200,66,0.08)" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GOLD, color: BG, borderRadius: 999, padding: "3px 14px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", letterSpacing: "0.1em", fontFamily: MONO }}>MEST POPULÆR</div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>Klublicens</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>1299<span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginLeft: 6 }}>DKK/md</span></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Op til 25 atleter</div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(245,200,66,0.15)", margin: "18px 0" }} />
              {["Op til 25 atleter", "Videoanalyse & noter", "Holdstatistik & PDF-rapporter", "Sæsonkalender (kollaborativ)", "Mental coaching & check-ins", "Skadeopfølgning", "Prioriteret support"].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/auth?tab=signup")} style={{ width: "100%", marginTop: 18, padding: "13px", borderRadius: 8, border: "none", background: GOLD, color: BG, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage →</button>
            </div>
            {/* Forbund */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>Forbund / Skole</div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Kontakt os</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Skalerbar aftale</div>
              <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "18px 0" }} />
              {["Ubegrænset atleter", "Flerklubs-overblik", "API-adgang", "Dedikeret onboarding", "SLA & prioriteret support"].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
              ))}
              <button onClick={() => navigate("/priser")} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.14)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Skriv til os</button>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button onClick={() => navigate("/priser")} style={{ background: "transparent", border: "none", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO, letterSpacing: "0.08em" }}>SE ALLE PRISER →</button>
          </div>
        </section>
      )}

      <Chapter n={native ? "07" : "08"} label="FAQ" title="Spørgsmål vi ofte får" />
      {/* FAQ ---------------------------------------------------------------- */}
      <section style={{ background: CARD, borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: `${isMobile ? 56 : 88}px ${pad}px` }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2 style={{ fontSize: "clamp(24px,3.6vw,34px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Spørgsmål vi ofte får</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { q: "Hvem er Sportstalent til?", a: "Klubber, forbund og selvstændige coaches indenfor konkurrencesport. Platformen er født i taekwondo, men de fleste værktøjer virker på tværs af sportsgrene." },
              { q: "Skal mine atleter bruge appen?", a: "Nej, men det anbefales. Coaches kan bruge platformen alene, men den fulde værdi kommer når atleterne også logger træning, humør og restitution." },
              { q: "Hvor længe tager onboarding?", a: "Under en time. Du opretter klubben, inviterer atleter med en kode, og de udfylder selv deres profil." },
              { q: "Hvad koster det?", a: "Fra 59 DKK/md for enkelte atleter, 1299 DKK/md for klublicens med op til 25 atleter. Se alle detaljer under Priser." },
              { q: "Hvor er data gemt?", a: "Alt data er hostet i EU (Frankfurt) og krypteret. Vi følger GDPR og du kan altid eksportere eller slette dine data." },
              { q: "Kan jeg opsige når som helst?", a: "Ja. Ingen binding. Sig op med ét klik — dine data er dine." },
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

      {/* FINAL CTA ---------------------------------------------------------- */}
      <section style={{ position: "relative", padding: `${isMobile ? 64 : 100}px ${pad}px`, textAlign: "center", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,200,66,0.12), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: GOLD, fontFamily: MONO, letterSpacing: "0.14em", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
            KLAR TIL START
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 18, lineHeight: 1.08 }}>
            Giv dine atleter den<br />
            <span style={{ color: GOLD, fontStyle: "italic" }}>platform</span> de fortjener
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Slut dig til coaches der allerede bruger Sportstalent til at udvikle talenter smartere.
          </p>
          <button onClick={() => navigate("/auth?tab=signup")} style={{ padding: "15px 38px", borderRadius: 10, border: "none", background: GOLD, color: BG, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 15px 40px rgba(245,200,66,0.25)" }}>Opret gratis konto →</button>
          <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: MONO, letterSpacing: "0.06em" }}>30 dage gratis · Intet kreditkort · Opsig når som helst</div>
        </div>
      </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `28px ${pad}px`, display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: 16 }}>
          <div>
            <BrandLogo height={36} onClick={() => navigate("/")} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>CVR 33685815 · København, Danmark</div>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 16 : 24, fontSize: 12, color: "rgba(255,255,255,0.75)", flexWrap: "wrap" }}>
            {[
              { label: "Privatlivspolitik", href: "/privacy" },
              { label: "Vilkår", href: "/terms" },
              { label: "Kontakt", href: "/priser" },
              { label: "Blog", href: "/blog" },
            ].map(l => <span key={l.href} onClick={() => navigate(l.href)} style={{ cursor: "pointer" }}>{l.label}</span>)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>© 2026 Sportstalent.dk</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
