import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useNavigate } from "react-router-dom";

const GOLD = "#F5C842";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const h2: React.CSSProperties = { fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.01em", color: "#fff" };
  const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.78)" };
  const ul: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.78)", paddingLeft: 20, margin: 0 };
  const section: React.CSSProperties = { marginBottom: 32 };

  return (
    <LandingLayout>
      <PageMeta
        title="Privacy Policy – Sportstalent"
        description="How Sportstalent processes and protects your personal data under GDPR."
      />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
          >
            ← {t("back")}
          </button>
          <LanguageSwitcher />
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 24, color: "#fff" }}>
          {t("privacyPolicyTitle")}
        </h1>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 40 }}>
          {t("privacyLastUpdated")}: 2026-07-21 · {t("privacyVersion")}
        </p>


        <section style={section}>
          <h2 style={h2}>{t("privacyWhoWeAre")}</h2>
          <p style={p}>{t("privacyWhoWeAreDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyWhatWeCollect")}</h2>
          <ul style={ul}>
            <li>{t("privacyCollect1")}</li>
            <li>{t("privacyCollect2")}</li>
            <li>{t("privacyCollect3")}</li>
            <li>{t("privacyCollect4")}</li>
            <li>{t("privacyCollect5")}</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyWhyWeCollect")}</h2>
          <ul style={ul}>
            <li>{t("privacyPurpose1")}</li>
            <li>{t("privacyPurpose2")}</li>
            <li>{t("privacyPurpose3")}</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyLegalBasis")}</h2>
          <p style={p}>{t("privacyLegalBasisDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyDataSharing")}</h2>
          <p style={p}>{t("privacyDataSharingDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyHealthDataTitle")}</h2>
          <p style={p}>{t("privacyHealthDataDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyAiTitle")}</h2>
          <p style={p}>{t("privacyAiDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyHosting")}</h2>
          <p style={p}>{t("privacyHostingDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyMinorConsent")}</h2>
          <p style={p}>{t("privacyMinorConsentDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyRetention")}</h2>
          <p style={p}>{t("privacyRetentionDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyYourRights")}</h2>
          <ul style={ul}>
            <li>{t("privacyRight1")}</li>
            <li>{t("privacyRight2")}</li>
            <li>{t("privacyRight3")}</li>
            <li>{t("privacyRight4")}</li>
            <li>{t("privacyRight5")}</li>
          </ul>
          <p style={{ ...p, marginTop: 12 }}>{t("privacyRightsHow")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>{t("privacyCookies")}</h2>
          <p style={p}>{t("privacyCookiesDesc")}</p>
        </section>

        <section style={section}>
          <h2 style={h2}>Blogkommentarer / Blog comments</h2>
          <p style={p}>
            Når du skriver en kommentar på vores blog, indsamler vi dit navn, din emailadresse og selve kommentaren.
            Din emailadresse vises <strong>aldrig offentligt</strong> og bruges udelukkende til at sende dig et bekræftelseslink
            (dobbelt opt-in), så vi kan verificere at du er ejer af adressen. Retsgrundlaget er dit samtykke (GDPR art. 6(1)(a)).
            Alle kommentarer modereres af en administrator før de offentliggøres. Du kan til enhver tid bede os slette
            din kommentar ved at kontakte os.
          </p>
          <p style={{ ...p, marginTop: 10 }}>
            When you submit a comment on our blog, we collect your name, email address and the comment itself.
            Your email address is <strong>never shown publicly</strong> and is used solely to send you a verification link
            (double opt-in) so we can confirm that you own the address. The legal basis is your consent (GDPR art. 6(1)(a)).
            All comments are reviewed by an administrator before being published. You can ask us to delete your comment
            at any time by contacting us.
          </p>
        </section>


        <section style={section}>
          <h2 style={h2}>{t("privacyContact")}</h2>
          <p style={p}>{t("privacyContactDesc")}</p>
          <p style={{ fontSize: 15, color: "#fff", fontWeight: 600, marginTop: 8 }}>kontakt@sportstalent.dk</p>
        </section>
      </div>
    </LandingLayout>
  );
}
