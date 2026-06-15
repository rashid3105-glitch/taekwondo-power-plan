import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import coachSittingAsset from "@/assets/coach-sitting.png.asset.json";
import coachStandingAsset from "@/assets/coach-standing.jpg.asset.json";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <div style={{ background: "#0B0C14", color: "#fff", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <PageMeta title="Sportstalent — Platformen til sportscoaches" description="Træningsplaner, videoanalyse og atletdata samlet ét sted." canonical="https://sportstalent.dk/" />

      {/* NAV */}
      <nav style={{ background: "rgba(11,12,20,0.95)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>Sports<span style={{ color: "#F5C842" }}>talent</span></div>
        <div style={{ display: "flex", gap: 28, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          {[
            { l: "Platform", to: "/programs" },
            { l: "Funktioner", to: "/methodology" },
            { l: "Priser", to: "/pricing" },
            { l: "Om os", to: "/about" },
          ].map(({ l, to }) => (
            <span key={l} onClick={() => navigate(to)} style={{ cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/auth")} style={{ padding: "8px 18px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log ind</button>
          <button onClick={() => navigate("/auth")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#F5C842", color: "#0B0C14", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Prøv gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "72px 32px 0", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#F5C842", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          🥋 BYGGET TIL SPORTSCOACHES
        </div>
        <h1 style={{ fontSize: "clamp(36px,6vw,62px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
          Platformen der løfter<br /><span style={{ color: "#F5C842" }}>talenter</span> til champions
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 500, margin: "0 auto 36px" }}>
          Stop med at jonglere regneark og spredte noter. Sportstalent samler træningsplaner, videoanalyse, stævner og atletdata — ét sted.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => navigate("/auth")} style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: "#F5C842", color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage →</button>
          <button style={{ padding: "13px 28px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Se platformen</button>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", flexWrap: "wrap" }}>
          {["30 dage gratis", "Intet kreditkort", "Opsig når som helst"].map((t, i) => (
            <span key={i}>✓ {t}</span>
          ))}
        </div>
        {/* Hero image */}
        <div style={{ maxWidth: 920, margin: "44px auto 0", borderRadius: "14px 14px 0 0", overflow: "hidden", border: "0.5px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>
          <img src={coachSittingAsset.url} alt="Coach guider atlet" style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }} />
          <div style={{ background: "#13141F", padding: "16px 24px", display: "flex", gap: 12, borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
            {[{ val: "24", up: "+3", label: "Aktive atleter" }, { val: "8", up: "", label: "Sessioner i dag" }, { val: "7 dage", up: "", label: "Næste stævne", gold: true }, { val: "91%", up: "", label: "Holdets aktivitet" }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "#1A1B2E", borderRadius: 8, padding: "12px 14px", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.gold ? "#F5C842" : "#fff" }}>{s.val} <span style={{ fontSize: 12, color: "#F5C842" }}>{s.up}</span></div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)", marginTop: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 14 }}>Bygget på årtiers erfaring</div>
          <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.2 }}>En platform skabt af coaches — til coaches</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: 0 }}>
            Sportstalent er bygget af aktive trænere med årtiers erfaring fra sportshallen. Hver eneste funktion løser et reelt problem fra hverdagen — ikke et tænkt scenarie fra et kontor. Vi deler ikke brugertal endnu; vi fokuserer på at bygge det bedste værktøj til dig og dine atleter.
          </p>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10 }}>Platformen</div>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>Alt hvad du behøver som sportscoach</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 440, margin: "0 auto" }}>Én platform erstatter regneark, beskedapps og spredte noter.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            { icon: "📋", title: "Træningsplaner", desc: "12-ugers programmer med periodisering og progressive overload" },
            { icon: "🎥", title: "Videoanalyse", desc: "Frame-by-frame scrubber med noter og tags på klippet" },
            { icon: "📊", title: "Fremgangsdata", desc: "Belastningsstyring og restitutionsanalyse i ét dashboard" },
            { icon: "🏆", title: "Stævner", desc: "Live nedtælling og resultatregistrering" },
            { icon: "🧠", title: "Mental coaching", desc: "Check-ins, humørregistrering og velvære for holdet" },
            { icon: "🩹", title: "Skadeopfølgning", desc: "Fra skadesdag til tilbagevenden — komplet tidslinje" },
            { icon: "💬", title: "Beskeder", desc: "Direkte kommunikation med atleter samlet ét sted" },
            { icon: "📄", title: "PDF-rapporter", desc: "Eksportér holdpræstationer med ét tryk" },
          ].map((f, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY */}
      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10 }}>Hvorfor Sportstalent</div>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>Bygget af coaches.<br />For coaches.</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 32 }}>Træt af at jonglere regneark, WhatsApp-beskeder og tre forskellige apps? Sportstalent samler alt i én platform.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { icon: "🥋", t: "Bygget til sport", d: "Designet til konkurrencesport med kamplens og stævner." },
                { icon: "📱", t: "App til atleter", d: "Dashboard med plan, stævner og coach-kontakt." },
                { icon: "⚡", t: "Spar 8+ timer/uge", d: "Automatisér opfølgning og rapportering." },
                { icon: "🤝", t: "Coach-samarbejde", d: "Del planer og sæsonkalender på tværs af hold." },
              ].map((w, i) => (
                <div key={i}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{w.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{w.t}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{w.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <img src={coachStandingAsset.url} alt="Coach i sportshallen" style={{ width: "100%", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} />
            <div style={{ position: "absolute", bottom: -14, left: -14, background: "#0B0C14", borderRadius: 10, padding: "12px 16px", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#F5C842" }}>67%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Mere tid til coaching</div>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10 }}>Coaches siger</div>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, letterSpacing: "-0.03em" }}>Hvad siger dem der bruger det?</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { text: "Sportstalent har halveret min tid på administration. Den tid bruger jeg på atleter i stedet.", feat: false },
            { text: "Endelig et redskab bygget til sportens krav. Videoanalysen alene er pengene værd.", feat: true },
            { text: "Mine atleter elsker app'en. Fremgangsvisningen motiverer dem til at træne konsistent.", feat: false },
          ].map((t, i) => (
            <div key={i} style={{ background: t.feat ? "rgba(245,200,66,0.07)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${t.feat ? "rgba(245,200,66,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: 26, color: t.feat ? "rgba(245,200,66,0.35)" : "rgba(255,255,255,0.1)", marginBottom: 10 }}>"</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, fontStyle: "italic", marginBottom: 18 }}>{t.text}</p>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>— Coach på platformen</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOUNDER */}
      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 48, alignItems: "start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src="/founder-farooq.jpg" alt="Farooq Rashid" style={{ width: 200, height: 260, objectFit: "cover", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.08)", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", bottom: -12, right: -12, background: "#0B0C14", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#F5C842" }}>30+</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>år i sporten</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10 }}>Grundlæggeren</div>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Farooq Rashid</h2>
            <div style={{ fontSize: 14, color: "#F5C842", fontWeight: 600, marginBottom: 20 }}>Grundlægger & Cheftræner, Copenhagen City Taekwondo</div>
            <div style={{ borderLeft: "3px solid #F5C842", paddingLeft: 18, marginBottom: 16 }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>"Jeg har brugt årtier som aktiv taekwondo-coach og oplevet på egen krop, hvad der mangler i moderne talentudvikling — et samlet sted til at følge, guide og løfte atleter fra begynder til verdensklasse."</p>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 22 }}>
              Sportstalent er ikke skabt på et kontor. Det er skabt i en sportshal, med sved på panden og atleter foran mig. Hvert eneste værktøj på platformen løser et problem jeg selv har stået med.<br /><br />
              Mit mål er enkelt: give enhver coach de redskaber, der gør dem i stand til at fokusere på det der virkelig betyder noget — at udvikle mennesker.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Sort bælte", "Cheftræner i 20+ år", "Copenhagen City TKD"].map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.22)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#F5C842" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10 }}>Priser</div>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>Simpel, transparent prissætning</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 380, margin: "0 auto" }}>Ingen skjulte gebyrer. Start gratis, opgrader når holdet vokser.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {/* Atlet */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Atlet</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em" }}>49</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>DKK/md</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {["Personlig træningsplan", "Stævneoversigt", "Beskeder fra coach", "Fremgangsstatistik"].map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 7 }}><span style={{ color: "#F5C842" }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 18, padding: "10px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Kom i gang</button>
          </div>
          {/* Club */}
          <div style={{ background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "24px", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#F5C842", color: "#0B0C14", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>Mest populær</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5C842", marginBottom: 8 }}>Klublicens</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em" }}>999</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>DKK/md · op til 25 atleter</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(245,200,66,0.15)", margin: "12px 0" }} />
            {["Op til 25 atleter", "Videoanalyse & noter", "Holdstatistik & PDF-rapporter", "Sæsonkalender (kollaborativ)", "Træningsplanbygger", "Mental coaching & check-ins", "Skadeopfølgning", "Prioriteret support"].map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", display: "flex", gap: 7, marginBottom: 7 }}><span style={{ color: "#F5C842" }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 18, padding: "12px", borderRadius: 8, border: "none", background: "#F5C842", color: "#0B0C14", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage</button>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>9.990 DKK/år — spar 2 måneder</div>
          </div>
          {/* Forbund */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Forbund / Skole</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Kontakt os</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}> </div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {["Ubegrænset atleter", "Flerklubs-overblik", "API-adgang", "Dedikeret onboarding", "SLA & prioriteret support"].map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 7 }}><span style={{ color: "#F5C842" }}>✓</span>{f}</div>
            ))}
            <button style={{ width: "100%", marginTop: 18, padding: "10px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Skriv til os</button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", padding: "72px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>Giv dine atleter den<br />platform de fortjener</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.65 }}>Slut dig til 150+ coaches der allerede bruger Sportstalent til at udvikle talenter smartere.</p>
        <button onClick={() => navigate("/auth")} style={{ padding: "14px 36px", borderRadius: 10, border: "none", background: "#F5C842", color: "#0B0C14", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Opret gratis konto →</button>
        <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>30 dage gratis · Intet kreditkort · Opsig når som helst</div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>Sports<span style={{ color: "#F5C842" }}>talent</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>CVR 33685815 · København, Danmark</div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {["Privatlivspolitik", "Vilkår", "Kontakt", "Blog"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© 2026 Sportstalent.dk</div>
        </div>
      </div>
    </div>
  );
};

export default Index;
