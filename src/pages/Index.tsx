import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ClipboardList, BarChart3, Brain, HeartPulse, BookOpen, UtensilsCrossed, HelpCircle,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";

function SectionPreview({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
  iconColor,
  onClick,
}: {
  icon: typeof ArrowRight;
  title: string;
  description: string;
  gradient: string;
  delay: string;
  iconColor: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-5 shadow-card hover:border-primary/40 hover:bg-card/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow text-left cursor-pointer"
      style={{ animationDelay: delay }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: gradient, filter: "blur(40px)", zIndex: -1 }}
      />
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/80 border border-border/40">
          <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-[13px] font-bold text-foreground tracking-tight leading-tight">{title}</h3>
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </button>
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
      slug: "plan",
    },
    {
      icon: BarChart3,
      titleKey: "sectionProgressTitle" as const,
      descKey: "sectionProgressDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(45 90% 55% / 0.08), transparent 70%)",
      iconColor: "text-tab-progress",
      slug: "progress",
    },
    {
      icon: Brain,
      titleKey: "sectionMentalTitle" as const,
      descKey: "sectionMentalDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(330 60% 72% / 0.08), transparent 70%)",
      iconColor: "text-tab-mental",
      slug: "mental",
    },
    {
      icon: HeartPulse,
      titleKey: "sectionRehabTitle" as const,
      descKey: "sectionRehabDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(0 72% 51% / 0.08), transparent 70%)",
      iconColor: "text-tab-rehab",
      slug: "rehab",
    },
    {
      icon: UtensilsCrossed,
      titleKey: "sectionNutritionTitle" as const,
      descKey: "sectionNutritionDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(25 90% 55% / 0.08), transparent 70%)",
      iconColor: "text-orange-400",
      slug: "nutrition",
    },
    {
      icon: BookOpen,
      titleKey: "sectionLibraryTitle" as const,
      descKey: "sectionLibraryDesc" as const,
      gradient: "radial-gradient(circle at 30% 50%, hsl(142 70% 45% / 0.08), transparent 70%)",
      iconColor: "text-tab-nutrition",
      slug: "library",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="TKD Power — AI Training for Taekwondo Athletes"
        description="AI-powered strength & conditioning for taekwondo athletes. Build explosive power, speed, and resilience with personalized training plans."
      />
      <Watermark />

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="TKD Power" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">TKD POWER</span>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="text-xs text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> {t("help" as any)}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs font-semibold">
            {t("signIn")}
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />

          <div className="relative max-w-2xl mx-auto text-center px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm px-3 py-1 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-speed animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("aiGenerated")} · {t("tkdSpecific")}
              </span>
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-[1.05]">
              {t("heroTitle")}{" "}
              <span className="text-gradient-energy">{t("heroHighlight")}</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {t("heroDescription")}
            </p>

            <div className="mt-7 flex justify-center gap-3">
              <Button onClick={() => navigate("/auth")} size="lg" className="px-7 font-bold text-sm shadow-glow">
                {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="px-7 font-semibold text-sm border-border/60">
                {t("viewPricing" as any)}
              </Button>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="max-w-2xl mx-auto px-5 pb-14 sm:pb-20" aria-label="Features">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {sections.map((s, i) => (
              <SectionPreview
                key={s.titleKey}
                icon={s.icon}
                title={t(s.titleKey)}
                description={t(s.descKey)}
                gradient={s.gradient}
                delay={`${i * 60}ms`}
                iconColor={s.iconColor}
                onClick={() => navigate(`/features/${s.slug}`)}
              />
            ))}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default Index;
