import { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const GOLD = "#F5C842";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

export default function Priser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", club: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.name) return;
    setSending(true);
    try {
      await supabase.functions.invoke("send-contact-email", {
        body: { name: form.name, email: form.email, club: form.club, message: form.message },
      });
    } catch (e) { /* silent */ }
    setSending(false);
    setSent(true);
  };

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const };

  return (
    <LandingLayout>
      <PageMeta title="Priser — Sportstalent" description="Simpel, transparent prissætning. Start gratis i 30 dage." canonical="https://sportstalent.dk/priser" />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          💰 PRISER
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
          Simpel, <span style={{ color: GOLD }}>transparent</span> prissætning
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
          Ingen skjulte gebyrer. Start gratis, opgrader når holdet vokser.
        </p>
      </section>

      <div style={sec}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, alignItems: "start" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Atlet</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>49</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>DKK/md</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>Til den enkelte udøver der vil følge sin udvikling.</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {["Personlig træningsplan", "Stævneoversigt", "Beskeder fra coach", "Fremgangsstatistik"].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Kom i gang</button>
          </div>

          {/* Starter */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>249</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>DKK/md</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>Til den lille klub med op til 5 atleter.</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {["Op til 5 atleter", "Træningsplaner", "Stævner", "Mental coaching", "Beskeder", "Skadeopfølgning", "Dagbog"].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            {["Videoanalyse", "PDF-rapporter", "Sæsonkalender"].map((f, i) => (
              <div key={`x-${i}`} style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", display: "flex", gap: 7, marginBottom: 8 }}><span>✕</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Kom i gang</button>
          </div>

          <div style={{ background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "28px 24px", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#0B0C14", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>Mest populær</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Klublicens</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>999</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>DKK/md</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>Op til 25 atleter — alle funktioner inkluderet.</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(245,200,66,0.15)", margin: "12px 0" }} />
            {["Op til 25 atleter", "Videoanalyse & noter", "Holdstatistik & PDF-rapporter", "Sæsonkalender (kollaborativ)", "Træningsplanbygger", "Mental coaching & check-ins", "Skadeopfølgning", "Prioriteret support"].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 8, border: "none", background: GOLD, color: "#0B0C14", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Start gratis i 30 dage</button>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>9.990 DKK/år — spar 2 måneder</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Forbund / Skole</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Kontakt os</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}> </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>Til forbund og uddannelsesinstitutioner med særlige behov.</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {["Ubegrænset atleter", "Flerklubs-overblik", "API-adgang", "Dedikeret onboarding", "SLA & prioriteret support"].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}>Udfyld kontaktformular ↓</button>
          </div>
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ ...sec, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ gridColumn: "1 / -1", textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>FAQ</span>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, letterSpacing: "-0.03em", marginTop: 8 }}>Ofte stillede spørgsmål</h2>
          </div>
          {[
            { q: "Hvad sker der efter 30 dage?", a: "Du vælger selv om du vil fortsætte. Vi sender en reminder 7 dage inden. Intet kreditkort kræves ved opstart." },
            { q: "Kan jeg opsige når som helst?", a: "Ja. Ingen binding. Opsig fra din profil med ét klik — virker med det samme." },
            { q: "Hvad er forskellen på atlet og klublicens?", a: "Klublicensen giver adgang til alle funktioner inkl. videoanalyse, holdstatistik og PDF-rapporter. Atletlicensen er til den individuelle udøver med begrænsede moduler." },
            { q: "Understøtter I andre sportsgrene end taekwondo?", a: "Platformen er bygget til taekwondo men kan bruges til alle kampsporter. Vi arbejder på bredere sportsunderstøttelse." },
          ].map((faq, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="contact-form" style={sec}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>Kontakt os</span>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>Spørgsmål om priser?</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>Skriv til os — vi vender tilbage inden for 24 timer.</p>
          </div>

          {sent ? (
            <div style={{ background: "rgba(245,200,66,0.08)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Besked modtaget!</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Vi vender tilbage inden for 24 timer.</div>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "32px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Navn *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dit navn" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="din@email.dk" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Klub / Organisation</label>
                <input value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder="Klubnavn" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Besked</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Hvad kan vi hjælpe med?" rows={4} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <button onClick={handleSubmit} disabled={sending || !form.name || !form.email} style={{ padding: "13px", borderRadius: 8, border: "none", background: form.name && form.email ? GOLD : "rgba(255,255,255,0.1)", color: form.name && form.email ? "#0B0C14" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 800, cursor: form.name && form.email ? "pointer" : "not-allowed" }}>
                {sending ? "Sender..." : "Send besked →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </LandingLayout>
  );
}
