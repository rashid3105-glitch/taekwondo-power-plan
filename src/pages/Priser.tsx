import { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#F5C842";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

export default function Priser() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const athleteFeatures = [t("pricingAthleteF1"), t("pricingAthleteF2"), t("pricingAthleteF3"), t("pricingAthleteF4")];
  const starterFeatures = [t("pricingStarterF1"), t("pricingStarterF2"), t("pricingStarterF3"), t("pricingStarterF4"), t("pricingStarterF5"), t("pricingStarterF6"), t("pricingStarterF7")];
  const starterMissing = [t("pricingMissingVideo"), t("pricingMissingPdf"), t("pricingMissingCal")];
  const clubFeatures = [t("pricingClubF1"), t("pricingClubF2"), t("pricingClubF3"), t("pricingClubF4"), t("pricingClubF5"), t("pricingClubF6"), t("pricingClubF7"), t("pricingClubF8")];
  const fedFeatures = [t("pricingFedF1"), t("pricingFedF2"), t("pricingFedF3"), t("pricingFedF4"), t("pricingFedF5")];
  const faqs = [
    { q: t("pricingFaqQ1"), a: t("pricingFaqA1") },
    { q: t("pricingFaqQ2"), a: t("pricingFaqA2") },
    { q: t("pricingFaqQ3"), a: t("pricingFaqA3") },
    { q: t("pricingFaqQ4"), a: t("pricingFaqA4") },
  ];

  return (
    <LandingLayout>
      <PageMeta title={`${t("navPricing")} — Sportstalent`} description={t("pricingSeoDesc")} canonical="https://sportstalent.dk/priser" />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,0.1)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          💰 {t("pricingBadge")}
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
          {t("pricingH1a")}<span style={{ color: GOLD }}>{t("pricingH1b")}</span>{t("pricingH1c")}
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
          {t("pricingSub")}
        </p>
      </section>

      <div style={sec}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, alignItems: "start" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{t("pricingTierAthlete")}</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>59</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{t("pricingPerMonth")}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>{t("pricingAthleteDesc")}</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {athleteFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("pricingCtaStart")}</button>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{t("pricingTierStarter")}</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>249</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{t("pricingPerMonth")}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>{t("pricingStarterDesc")}</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {starterFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            {starterMissing.map((f, i) => (
              <div key={`x-${i}`} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", display: "flex", gap: 7, marginBottom: 8 }}><span>✕</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("pricingCtaStart")}</button>
          </div>

          <div style={{ background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "28px 24px", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#0B0C14", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{t("pricingMostPopular")}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>{t("pricingTierClub")}</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>1299</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{t("pricingPerMonth")}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>{t("pricingClubDesc")}</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(245,200,66,0.15)", margin: "12px 0" }} />
            {clubFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 8, border: "none", background: GOLD, color: "#0B0C14", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{t("pricingCtaTrialClub")}</button>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t("pricingClubYearly")}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{t("pricingTierFed")}</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>{t("pricingContactUs")}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}> </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>{t("pricingFedDesc")}</div>
            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />
            {fedFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, marginBottom: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
            <button style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}>{t("pricingFedCta")}</button>
          </div>
        </div>
      </div>

      <div style={{ background: "#13141F", borderTop: "0.5px solid rgba(255,255,255,0.07)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ ...sec, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ gridColumn: "1 / -1", textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>{t("pricingFaqLabel")}</span>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, letterSpacing: "-0.03em", marginTop: 8 }}>{t("pricingFaqTitle")}</h2>
          </div>
          {faqs.map((faq, i) => (
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
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>{t("pricingContactUs")}</span>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>{t("pricingContactTitle")}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{t("pricingContactSub")}</p>
          </div>

          {sent ? (
            <div style={{ background: "rgba(245,200,66,0.08)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("pricingContactSuccess")}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{t("pricingContactSuccessSub")}</div>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "32px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{t("pricingLabelName")}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("pricingPHName")} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{t("pricingLabelEmail")}</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("pricingPHEmail")} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{t("pricingLabelClub")}</label>
                <input value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder={t("pricingPHClub")} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{t("pricingLabelMessage")}</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={t("pricingPHMessage")} rows={4} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <button onClick={handleSubmit} disabled={sending || !form.name || !form.email} style={{ padding: "13px", borderRadius: 8, border: "none", background: form.name && form.email ? GOLD : "rgba(255,255,255,0.1)", color: form.name && form.email ? "#0B0C14" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 800, cursor: form.name && form.email ? "pointer" : "not-allowed" }}>
                {sending ? t("pricingSending") : t("pricingSend")}
              </button>
            </div>
          )}
        </div>
      </div>
    </LandingLayout>
  );
}
