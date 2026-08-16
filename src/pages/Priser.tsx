import { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#D4AF37";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

// Club licence plans — yearly billing, prices incl. VAT (DKK/year).
// `id` must match the tier keys in the create-checkout-session edge function.
const PLANS: { id: string; nameKey: string; limitKey: string; price: number | null; highlight?: boolean }[] = [
  { id: "club", nameKey: "pricingPlanClub", limitKey: "pricingPlanClubLimit", price: 7500 },
  { id: "club_plus", nameKey: "pricingPlanClubPlus", limitKey: "pricingPlanClubPlusLimit", price: 12000, highlight: true },
  { id: "large", nameKey: "pricingPlanBig", limitKey: "pricingPlanBigLimit", price: null },
];

const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Sportstalent klublicens",
  description: "Klublicens til Sportstalent — årlig fakturering, alle priser inkl. moms.",
  brand: { "@type": "Brand", name: "Sportstalent" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "DKK",
    lowPrice: 7500,
    highPrice: 12000,
    offerCount: 2,
    valueAddedTaxIncluded: true,
    url: "https://sportstalent.dk/priser",
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "DKK",
      valueAddedTaxIncluded: true,
      billingDuration: 12,
      billingIncrement: 1,
      unitCode: "ANN",
    },
  },
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSONLD) }} />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.1)", border: "0.5px solid rgba(212,175,55,0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
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
        {/* Reference-club promo banner */}
        <div style={{ background: "rgba(212,175,55,0.1)", border: "0.5px solid rgba(212,175,55,0.35)", borderRadius: 12, padding: "14px 18px", fontSize: 14, fontWeight: 700, color: GOLD, lineHeight: 1.5, marginBottom: 20, textAlign: "center" }}>
          {t("pricingRefBanner")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, alignItems: "stretch" }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              background: plan.highlight ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${plan.highlight ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 14, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: plan.highlight ? GOLD : "rgba(255,255,255,0.55)" }}>
                {t(plan.nameKey as Parameters<typeof t>[0])}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{t(plan.limitKey as Parameters<typeof t>[0])}</div>
              <div style={{ fontSize: plan.price ? 36 : 26, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: 6 }}>
                {plan.price ? plan.price.toLocaleString("da-DK") : t("pricingPlanContact")}
              </div>
              {plan.price && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t("pricingPerYearUnit")}</div>
              )}
              <button
                onClick={() => (plan.price ? navigate("/auth") : document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" }))}
                style={{ marginTop: "auto", padding: "12px", borderRadius: 8, border: plan.highlight ? "none" : "0.5px solid rgba(212,175,55,0.5)", background: plan.highlight ? GOLD : "transparent", color: plan.highlight ? "#0B0C14" : GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                {plan.price ? t("pricingPlanCta") : t("pricingPlanContact")}
              </button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 16, lineHeight: 1.6 }}>{t("pricingVatNote")}</div>
      </div>


      {/* ── Let's talk ─────────────────────────────────────────── */}
      <div style={sec}>
        <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07), rgba(255,255,255,0.02))", border: "0.5px solid rgba(212,175,55,0.22)", borderRadius: 16, padding: "32px 26px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>{t("pricingTalkEyebrow")}</span>
          <h2 style={{ fontSize: "clamp(22px,3.2vw,32px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "10px 0 12px" }}>{t("pricingTalkTitle")}</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 620, marginBottom: 20 }}>{t("pricingTalkBody")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginBottom: 24 }}>
            {[t("pricingTalk1"), t("pricingTalk2"), t("pricingTalk3"), t("pricingTalk4"), ...fedFeatures].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, lineHeight: 1.55 }}>
                <span style={{ color: GOLD, flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "13px 28px", borderRadius: 8, border: "none", background: GOLD, color: "#0B0C14", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{t("pricingTalkCta")}</button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{t("pricingTalkNote")}</span>
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
            <div style={{ background: "rgba(212,175,55,0.08)", border: "0.5px solid rgba(212,175,55,0.28)", borderRadius: 14, padding: "32px", textAlign: "center" }}>
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

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "0.5px solid rgba(255,255,255,0.08)", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
          Usikker på, hvad I har brug for?{" "}
          <button onClick={() => navigate("/klubanalyse")} style={{ background: "none", border: "none", padding: 0, color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>
            Tag Klubanalysen først
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
