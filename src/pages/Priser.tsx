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
      <PageMeta title={t("pricingSeoTitle")} description={t("pricingSeoDesc")} canonical="https://sportstalent.dk/priser" />

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, alignItems: "stretch" }}>
          {TIERS.map((tier) => {
            const active = athletes >= tier.min && athletes <= tier.max;
            return (
              <div key={tier.min} style={{
                background: active ? "rgba(245,200,66,0.07)" : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${active ? "rgba(245,200,66,0.35)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14, padding: "20px 18px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? GOLD : "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                  {tier.min}–{tier.max} {t("pricingAthletesWord")}
                </div>
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{tier.rate}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{t("pricingPerAthleteMonth")}</div>
                <div style={{ fontSize: 11, color: tier.discount ? GOLD : "rgba(255,255,255,0.35)", marginTop: 10, fontWeight: 700 }}>
                  {tier.discount ? `−${tier.discount}% ${t("pricingDiscountWord")}` : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 14, lineHeight: 1.6 }}>{t("pricingTierNote")}</div>

        <div style={{ marginTop: 28, background: "rgba(245,200,66,0.06)", border: "0.5px solid rgba(245,200,66,0.28)", borderRadius: 14, padding: "26px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{t("pricingCalcTitle")}</div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
            {t("pricingCalcAthletes")}: <span style={{ color: GOLD, fontWeight: 800 }}>{athletes}</span>
          </label>
          <input type="range" min={1} max={50} value={athletes} onChange={(e) => setAthletes(Number(e.target.value))}
            style={{ width: "100%", accentColor: GOLD }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{t("pricingCalcMonthly")}</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>{monthly.toLocaleString("da-DK")} kr</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{t("pricingCalcYearly")}</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: GOLD }}>{yearly.toLocaleString("da-DK")} kr</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>{t("pricingBilledYearly")}</div>
          <button onClick={() => navigate("/auth")} style={{ width: "100%", marginTop: 20, padding: "13px", borderRadius: 8, border: "none", background: GOLD, color: "#0B0C14", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{t("pricingCtaTrialClub")}</button>
        </div>

        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{t("pricingTierFed")}</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>kontakt@sportstalent.dk</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", marginBottom: 14, lineHeight: 1.5 }}>{t("pricingFedDesc")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginBottom: 16 }}>
            {fedFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7 }}><span style={{ color: GOLD }}>✓</span>{f}</div>
            ))}
          </div>
          <button style={{ padding: "11px 22px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}>{t("pricingFedCta")}</button>
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
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", display: "block", marginBottom: 6 }}>{t("pricingLabelName")}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("pricingPHName")} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", display: "block", marginBottom: 6 }}>{t("pricingLabelEmail")}</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("pricingPHEmail")} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", display: "block", marginBottom: 6 }}>{t("pricingLabelClub")}</label>
                <input value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder={t("pricingPHClub")} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", display: "block", marginBottom: 6 }}>{t("pricingLabelMessage")}</label>
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
