import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Zap, Shield, Brain, Target, TrendingUp, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.webp";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { PeriodizationDiagram } from "@/components/PeriodizationDiagram";

type TranslationKey =
  | "methPageTitle"
  | "methPageDesc"
  | "methHeroTitle"
  | "methHeroSubtitle"
  | "methWhyTitle"
  | "methWhyBody"
  | "methAdaptTitle"
  | "methAdaptBody"
  | "methAdaptList1"
  | "methAdaptList2"
  | "methAdaptList3"
  | "methAdaptList4"
  | "methAdaptList5"
  | "methAdaptOutro"
  | "methSparTitle"
  | "methSparIntro"
  | "methSparSparring"
  | "methSparSparringBody"
  | "methSparRecovery"
  | "methSparRecoveryBody"
  | "methSparExplosive"
  | "methSparExplosiveBody"
  | "methErrorTitle"
  | "methErrorIntro"
  | "methErrorList1"
  | "methErrorList2"
  | "methErrorList3"
  | "methErrorList4"
  | "methErrorList5"
  | "methErrorOutro"
  | "methResultsTitle"
  | "methResultsIntro"
  | "methResultsList1"
  | "methResultsList2"
  | "methResultsList3"
  | "methResultsList4"
  | "methResultsList5"
  | "methResultsList6"
  | "methResultsOutro";

const sections = [
  {
    icon: Zap,
    titleKey: "methWhyTitle" as TranslationKey,
    bodyKey: "methWhyBody" as TranslationKey,
    color: "text-[hsl(var(--energy))]",
    bgColor: "bg-[hsl(var(--energy)/0.1)]",
  },
  {
    icon: RefreshCw,
    titleKey: "methAdaptTitle" as TranslationKey,
    bodyKey: "methAdaptBody" as TranslationKey,
    color: "text-[hsl(var(--power))]",
    bgColor: "bg-[hsl(var(--power)/0.1)]",
    listKeys: [
      "methAdaptList1",
      "methAdaptList2",
      "methAdaptList3",
      "methAdaptList4",
      "methAdaptList5",
    ] as TranslationKey[],
    outroKey: "methAdaptOutro" as TranslationKey,
  },
  {
    icon: Shield,
    titleKey: "methSparTitle" as TranslationKey,
    bodyKey: "methSparIntro" as TranslationKey,
    color: "text-[hsl(var(--explosive))]",
    bgColor: "bg-[hsl(var(--explosive)/0.1)]",
    subsections: [
      { label: "methSparSparring" as TranslationKey, body: "methSparSparringBody" as TranslationKey },
      { label: "methSparRecovery" as TranslationKey, body: "methSparRecoveryBody" as TranslationKey },
      { label: "methSparExplosive" as TranslationKey, body: "methSparExplosiveBody" as TranslationKey },
    ],
  },
  {
    icon: Brain,
    titleKey: "methErrorTitle" as TranslationKey,
    bodyKey: "methErrorIntro" as TranslationKey,
    color: "text-[hsl(var(--tab-mental))]",
    bgColor: "bg-[hsl(330_60%_72%/0.1)]",
    listKeys: [
      "methErrorList1",
      "methErrorList2",
      "methErrorList3",
      "methErrorList4",
      "methErrorList5",
    ] as TranslationKey[],
    outroKey: "methErrorOutro" as TranslationKey,
  },
  {
    icon: TrendingUp,
    titleKey: "methResultsTitle" as TranslationKey,
    bodyKey: "methResultsIntro" as TranslationKey,
    color: "text-[hsl(var(--speed))]",
    bgColor: "bg-[hsl(var(--speed)/0.1)]",
    listKeys: [
      "methResultsList1",
      "methResultsList2",
      "methResultsList3",
      "methResultsList4",
      "methResultsList5",
      "methResultsList6",
    ] as TranslationKey[],
    outroKey: "methResultsOutro" as TranslationKey,
  },
];

export default function Methodology() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();

  const tt = (key: TranslationKey) => t(key);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title={tt("methPageTitle")}
        description={tt("methPageDesc")}
        canonical="https://sportstalent.dk/methodology"
      />
      <Watermark />

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">SPORTSTALENT</span>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs font-semibold">
            {t("signIn")}
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-8 sm:pt-16 sm:pb-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-6 text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {locale === "da" ? "Tilbage" : locale === "sv" ? "Tillbaka" : "Back"}
            </Button>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.08]">
              {tt("methHeroTitle")}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              {tt("methHeroSubtitle")}
            </p>
          </div>
        </section>

        {/* Gradient transition */}
        <div className="h-20 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

        <div className="theme-light-section">
        {/* Periodization diagram */}
        <section className="max-w-2xl mx-auto px-5">
          <PeriodizationDiagram />
        </section>

        {/* Content sections */}
        <section className="max-w-2xl mx-auto px-5 pb-16 sm:pb-24 space-y-8">
          {sections.map((s) => (
            <article
              key={s.titleKey}
              className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bgColor} border border-border/40`}>
                  <s.icon className={`h-[18px] w-[18px] ${s.color}`} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight pt-1.5">
                  {tt(s.titleKey)}
                </h2>
              </div>

              <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
                {tt(s.bodyKey)}
              </p>

              {s.listKeys && (
                <ul className="mt-4 space-y-2">
                  {s.listKeys.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-[13px] sm:text-sm text-foreground/90">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${s.bgColor} ring-1 ring-border/40`} />
                      {tt(k)}
                    </li>
                  ))}
                </ul>
              )}

              {s.subsections && (
                <div className="mt-5 space-y-4">
                  {s.subsections.map((sub) => (
                    <div key={sub.label}>
                      <h3 className="text-[13px] sm:text-sm font-semibold text-foreground mb-1">
                        {tt(sub.label)}
                      </h3>
                      <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                        {tt(sub.body)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {s.outroKey && (
                <p className="mt-4 text-[13px] sm:text-sm text-muted-foreground leading-relaxed italic">
                  {tt(s.outroKey)}
                </p>
              )}
            </article>
          ))}

          {/* Remove duplicate CTA inside light section */}
        </section>
        </div>

        {/* CTA — back to dark */}
        <div className="bg-gradient-to-b from-[hsl(210,20%,97%)] to-background h-12" aria-hidden="true" />
        <div className="text-center pb-12">
          <Button onClick={() => navigate("/auth")} size="lg" className="px-7 font-bold text-sm shadow-glow">
            {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
