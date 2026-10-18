import { Button } from "@/components/ui/button";
import { trackCta } from "@/lib/ctaTracking";
import { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "hsl(var(--primary))";
const sec = { maxWidth: 1000, margin: "0 auto", padding: "72px 32px" };

// Club licence plans — yearly billing, prices excl. VAT (DKK/year).
const PLANS: { id: string; nameKey: string; limitKey: string; price: number | null; highlight?: boolean }[] = [
  { id: "club", nameKey: "pricingPlanClub", limitKey: "pricingPlanClubLimit", price: 7500 },
  { id: "club_plus", nameKey: "pricingPlanClubPlus", limitKey: "pricingPlanClubPlusLimit", price: 12000, highlight: true },
  { id: "club_big", nameKey: "pricingPlanClubBig", limitKey: "pricingPlanClubBigLimit", price: 18000 },
  { id: "large", nameKey: "pricingPlanBig", limitKey: "pricingPlanBigLimit", price: null },
];

const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Sportstalent klublicens",
  description: "Klublicens til Sportstalent — årlig fakturering, alle priser ekskl. moms.",
  brand: { "@type": "Brand", name: "Sportstalent" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "DKK",
    lowPrice: 7500,
    highPrice: 18000,
    offerCount: 3,
    valueAddedTaxIncluded: false,
    url: "https://sportstalent.dk/priser",
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: 7500,
      priceCurrency: "DKK",
      valueAddedTaxIncluded: false,
      billingDuration: 12,
      billingIncrement: 1,
      unitCode: "ANN",
    },
  },
};

export default function Priser() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", club: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  // Self-service Stripe checkout is intentionally DISABLED: the founding banner above the
  // cards promises 50% off, but that discount is granted manually and there is no coupon in
  // the system — a club clicking through would be charged full price. All cards therefore
  // scroll to the contact form. The checkout code below is kept so it can be re-enabled later.
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setCheckoutError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=/priser");
      return;
    }
    setCheckoutPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { tier: planId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("No checkout URL");
    } catch (e) {
      setCheckoutError(t("pricingCheckoutError"));
    } finally {
      setCheckoutPlan(null);
    }
  };
  void handleCheckout; void checkoutPlan; void checkoutError;

  const scrollToContact = () => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });






  const [sendError, setSendError] = useState(false);
  const handleSubmit = async () => {
    if (!form.email || !form.name) return;
    setSending(true);
    setSendError(false);
    // Store the lead first — success is only shown once it is safely saved.
    const msg = [form.club.trim() && `Klub: ${form.club.trim()}`, form.message.trim()].filter(Boolean).join("\n\n") || "-";
    const { error } = await supabase
      .from("contact_submissions")
      .insert({ name: form.name.trim().slice(0, 100), email: form.email.trim().slice(0, 255), message: msg.slice(0, 1000) });
    if (error) {
      setSending(false);
      setSendError(true);
      return;
    }
    // Email notification is best-effort; the stored lead is the source of truth.
    supabase.functions.invoke("send-contact-email", {
      body: { name: form.name, email: form.email, club: form.club, message: form.message },
    }).catch(() => undefined);
    trackCta("contact_submitted");
    setSending(false);
    setSent(true);
  };

  const inputStyle = { width: "100%", background: "hsl(var(--muted))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "hsl(var(--foreground))", outline: "none", boxSizing: "border-box" as const };

  const starterFeatures = [t("pricingStarterF1"), t("pricingStarterF2"), t("pricingStarterF3"), t("pricingStarterF4"), t("pricingStarterF5"), t("pricingStarterF6"), t("pricingStarterF7")];
  const starterMissing = [t("pricingMissingVideo"), t("pricingMissingPdf"), t("pricingMissingCal")];
  const clubFeatures = [t("pricingClubF1"), t("pricingClubF2"), t("pricingClubF3"), t("pricingClubF4"), t("pricingClubF5"), t("pricingClubF6"), t("pricingClubF7"), t("pricingClubF8")];
  const fedFeatures = [t("pricingFedF1"), t("pricingFedF2"), t("pricingFedF3"), t("pricingFedF4"), t("pricingFedF5")];
  const faqs = [
    { q: t("pricingFaqQ1"), a: t("pricingFaqA1") },
    { q: t("pricingFaqQ2"), a: t("pricingFaqA2") },
    { q: t("pricingFaqQ3"), a: t("pricingFaqA3") },
    { q: t("pricingFaqQ4"), a: t("pricingFaqA4") },
    { q: t("pricingFaqQ5"), a: t("pricingFaqA5") },
    { q: t("pricingFaqQ6"), a: t("pricingFaqA6") },
    { q: t("pricingFaqQ7"), a: t("pricingFaqA7") },
  ];

  return (
    <LandingLayout>
      <PageMeta title={t("pricingSeoTitle")} description={t("pricingSeoDesc")} canonical="https://sportstalent.dk/priser" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSONLD) }} />

      <section style={{ padding: "80px 32px", textAlign: "center", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "hsl(var(--primary) / 0.1)", border: "0.5px solid hsl(var(--primary) / 0.28)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 24 }}>
          💰 {t("pricingBadge")}
        </div>
        <h1 style={{ fontSize: "54px", fontWeight: 900, lineHeight: 1.07, letterSpacing: "0", margin: "0 0 20px" }}>
          {t("pricingH1a")}<span style={{ color: GOLD }}>{t("pricingH1b")}</span>{t("pricingH1c")}
        </h1>
        <p style={{ fontSize: 17, color: "hsl(var(--muted-foreground))", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
          {t("pricingSub")}
        </p>
      </section>

      <div style={sec}>
        {/* Reference-club promo banner */}
        <div style={{ background: "hsl(var(--primary) / 0.1)", border: "0.5px solid hsl(var(--primary) / 0.35)", borderRadius: 8, padding: "14px 18px", fontSize: 14, fontWeight: 700, color: GOLD, lineHeight: 1.5, marginBottom: 20, textAlign: "center" }}>
          {t("pricingRefBanner")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, alignItems: "stretch" }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              background: plan.highlight ? "hsl(var(--primary) / 0.07)" : "hsl(var(--border))",
              border: `0.5px solid ${plan.highlight ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
              borderRadius: 8, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: plan.highlight ? GOLD : "hsl(var(--muted-foreground))" }}>
                {t(plan.nameKey as Parameters<typeof t>[0])}
              </div>
              <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>{t(plan.limitKey as Parameters<typeof t>[0])}</div>
              <div style={{ fontSize: plan.price ? 36 : 26, fontWeight: 900, letterSpacing: "0", lineHeight: 1.1, marginTop: 6 }}>
                {plan.price ? plan.price.toLocaleString("da-DK") : t("pricingPlanContact")}
              </div>
              {plan.price && (
                <>
                  <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{t("pricingPerYearUnit")}</div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                    {t("pricingInclVatNote").replace("{amount}", Math.round(plan.price * 1.25).toLocaleString("da-DK"))}
                  </div>
                </>
              )}
              <Button
                onClick={scrollToContact}
                style={{ marginTop: "auto", padding: "12px", borderRadius: 8, border: plan.highlight ? "none" : "0.5px solid hsl(var(--primary) / 0.5)", background: plan.highlight ? GOLD : "transparent", color: plan.highlight ? "hsl(var(--primary-foreground))" : GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                {t("pricingPlanContact")}
              </Button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 16, lineHeight: 1.6 }}>{t("pricingTermsNote")}</div>

        {(() => {
          const TR = {
            da: ["GDPR-klar med samtykkestyring", "Data isoleret pr. klub", "Forældre får læseadgang", "Tofaktor-login (2FA)"],
            en: ["GDPR-ready consent management", "Data isolated per club", "Parents get read-only access", "Two-factor login (2FA)"],
            sv: ["GDPR-redo samtyckeshantering", "Data isolerad per klubb", "Föräldrar får läsbehörighet", "Tvåfaktorsinloggning (2FA)"],
            de: ["DSGVO-konforme Einwilligungsverwaltung", "Daten pro Verein isoliert", "Eltern erhalten Lesezugriff", "Zwei-Faktor-Login (2FA)"],
            ar: ["إدارة موافقة متوافقة مع GDPR", "بيانات معزولة لكل نادٍ", "وصول للقراءة فقط لأولياء الأمور", "تسجيل دخول بخطوتين (2FA)"],
            no: ["GDPR-klar samtykkehåndtering", "Data isolert per klubb", "Foreldre får lesetilgang", "Tofaktor-innlogging (2FA)"],
            es: ["Gestión de consentimiento conforme al RGPD", "Datos aislados por club", "Los padres tienen acceso de lectura", "Inicio de sesión en dos pasos (2FA)"],
          } as const;
          const items = TR[locale as keyof typeof TR] ?? TR.en;
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 20 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ color: GOLD }}>✓</span>{it}
                </div>
              ))}
            </div>
          );
        })()}
      </div>


      {/* ── Let's talk ─────────────────────────────────────────── */}
      <div style={sec}>
        <div style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.07), hsl(var(--border)))", border: "0.5px solid hsl(var(--primary) / 0.22)", borderRadius: 8, padding: "32px 26px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>{t("pricingTalkEyebrow")}</span>
          <h2 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "0", margin: "10px 0 12px" }}>{t("pricingTalkTitle")}</h2>
          <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", lineHeight: 1.7, maxWidth: 620, marginBottom: 20 }}>{t("pricingTalkBody")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginBottom: 24 }}>
            {[t("pricingTalk1"), t("pricingTalk2"), t("pricingTalk3"), t("pricingTalk4"), ...fedFeatures].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", display: "flex", gap: 8, lineHeight: 1.55 }}>
                <span style={{ color: GOLD, flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Button onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "13px 28px", borderRadius: 8, border: "none", background: GOLD, color: "hsl(var(--primary-foreground))", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{t("pricingTalkCta")}</Button>
            <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{t("pricingTalkNote")}</span>
          </div>
        </div>
      </div>


      <div style={{ background: "hsl(var(--muted))", borderTop: "0.5px solid hsl(var(--border))", borderBottom: "0.5px solid hsl(var(--border))" }}>
        <div className="pricing-faq-grid" style={{ ...sec, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ gridColumn: "1 / -1", textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>{t("pricingFaqLabel")}</span>
            <h2 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "0", marginTop: 8 }}>{t("pricingFaqTitle")}</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: "hsl(var(--muted))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="contact-form" style={sec}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 }}>{t("pricingContactUs")}</span>
            <h2 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "0", marginBottom: 10 }}>{t("pricingContactTitle")}</h2>
            <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>{t("pricingContactSub")}</p>
          </div>

          {sent ? (
            <div style={{ background: "hsl(var(--primary) / 0.08)", border: "0.5px solid hsl(var(--primary) / 0.28)", borderRadius: 8, padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("pricingContactSuccess")}</div>
              <div style={{ fontSize: 14, color: "hsl(var(--muted-foreground))" }}>{t("pricingContactSuccessSub")}</div>
            </div>
          ) : (
            <div style={{ background: "hsl(var(--muted))", border: "0.5px solid hsl(var(--border))", borderRadius: 8, padding: "32px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="pricing-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 6 }}>{t("pricingLabelName")}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("pricingPHName")} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 6 }}>{t("pricingLabelEmail")}</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("pricingPHEmail")} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 6 }}>{t("pricingLabelClub")}</label>
                <input value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder={t("pricingPHClub")} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 6 }}>{t("pricingLabelMessage")}</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={t("pricingPHMessage")} rows={4} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <Button onClick={handleSubmit} disabled={sending || !form.name || !form.email} style={{ padding: "13px", borderRadius: 8, border: "none", background: form.name && form.email ? GOLD : "hsl(var(--border))", color: form.name && form.email ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))", fontSize: 14, fontWeight: 800, cursor: form.name && form.email ? "pointer" : "not-allowed" }}>
                {sending ? t("pricingSending") : t("pricingSend")}
              </Button>
              {sendError && (
                <div role="alert" style={{ fontSize: 13, color: "hsl(var(--destructive))", textAlign: "center" }}>
                  {t("error")} — <a href="/contact" style={{ color: "hsl(var(--destructive))", textDecoration: "underline" }}>{t("pricingContactUs")}</a>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "0.5px solid hsl(var(--border))", textAlign: "center", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
          Usikker på, hvad I har brug for?{" "}
          <Button onClick={() => { trackCta("pricing_analysis"); navigate("/klubanalyse"); }} style={{ background: "none", border: "none", padding: 0, color: "hsl(var(--muted-foreground))", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>
            Tag Klubanalysen først
          </Button>
        </div>
      </div>
    </LandingLayout>
  );
}
