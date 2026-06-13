import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Privacy Policy – Sportstalent"
        description="How Sportstalent processes and protects your personal data under GDPR."
      />
      <Watermark />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Sportstalent" className="h-9 w-9 rounded-lg object-contain cursor-pointer" onClick={() => navigate("/")} />
            <span className="text-sm font-extrabold text-card-foreground">SPORTSTALENT</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
        </Button>

        <h1 className="text-2xl font-extrabold text-foreground">{t("privacyPolicyTitle")}</h1>
        <p className="text-xs text-muted-foreground">{t("privacyLastUpdated")}: 2026-06-13</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyWhoWeAre")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyWhoWeAreDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyWhatWeCollect")}</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>{t("privacyCollect1")}</li>
            <li>{t("privacyCollect2")}</li>
            <li>{t("privacyCollect3")}</li>
            <li>{t("privacyCollect4")}</li>
            <li>{t("privacyCollect5")}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyWhyWeCollect")}</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>{t("privacyPurpose1")}</li>
            <li>{t("privacyPurpose2")}</li>
            <li>{t("privacyPurpose3")}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyLegalBasis")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyLegalBasisDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyDataSharing")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyDataSharingDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyHosting")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyHostingDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyMinorConsent")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyMinorConsentDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyRetention")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyRetentionDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyYourRights")}</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>{t("privacyRight1")}</li>
            <li>{t("privacyRight2")}</li>
            <li>{t("privacyRight3")}</li>
            <li>{t("privacyRight4")}</li>
            <li>{t("privacyRight5")}</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyRightsHow")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyCookies")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyCookiesDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyContact")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyContactDesc")}</p>
          <p className="text-sm text-foreground font-medium">rashid3105@gmail.com</p>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
