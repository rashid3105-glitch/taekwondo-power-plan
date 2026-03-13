import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, ClipboardList, BarChart3, Brain, HeartPulse, BookOpen, UtensilsCrossed, HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function SectionPreview({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
  iconColor,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  gradient: string;
  delay: string;
  iconColor: string;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-card hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: gradient, filter: "blur(40px)", zIndex: -1 }}
      />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  const sections = [
    {
      icon: ClipboardList,
      titleKey: "sectionPlanTitle" as const,
      descKey: "sectionPlanDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(210 90% 56% / 0.08), transparent 70%)",
      iconColor: "text-tab-plan",
    },
    {
      icon: BarChart3,
      titleKey: "sectionProgressTitle" as const,
      descKey: "sectionProgressDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(45 90% 55% / 0.08), transparent 70%)",
      iconColor: "text-tab-progress",
    },
    {
      icon: Brain,
      titleKey: "sectionMentalTitle" as const,
      descKey: "sectionMentalDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(330 60% 72% / 0.08), transparent 70%)",
      iconColor: "text-tab-mental",
    },
    {
      icon: HeartPulse,
      titleKey: "sectionRehabTitle" as const,
      descKey: "sectionRehabDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(0 72% 51% / 0.08), transparent 70%)",
      iconColor: "text-tab-rehab",
    },
    {
      icon: BookOpen,
      titleKey: "sectionLibraryTitle" as const,
      descKey: "sectionLibraryDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(142 70% 45% / 0.08), transparent 70%)",
      iconColor: "text-tab-nutrition",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-energy">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">TKD POWER</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="text-xs">
            <HelpCircle className="h-4 w-4 mr-1" /> {t("help" as any)}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs">
            {t("signIn")}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.3), transparent 70%)" }}
          />

          <div className="relative max-w-3xl mx-auto text-center px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-speed animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("aiGenerated")} · {t("tkdSpecific")}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              {t("heroTitle")}{" "}
              <span className="text-gradient-energy">{t("heroHighlight")}</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t("heroDescription")}
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={() => navigate("/auth")} size="lg" className="px-8 font-semibold">
                {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="px-8 font-semibold">
                {t("viewPricing" as any)}
              </Button>
            </div>
          </div>
        </section>

        {/* Section previews */}
        <section className="max-w-3xl mx-auto px-6 pb-16 sm:pb-24">
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((s, i) => (
              <SectionPreview
                key={s.titleKey}
                icon={s.icon}
                title={t(s.titleKey)}
                description={t(s.descKey)}
                gradient={s.gradient}
                delay={`${i * 80}ms`}
                iconColor={s.iconColor}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-5">
        <p className="text-center text-[11px] text-muted-foreground tracking-wide">
          {t("footerText")}
        </p>
      </footer>
    </div>
  );
};

export default Index;
