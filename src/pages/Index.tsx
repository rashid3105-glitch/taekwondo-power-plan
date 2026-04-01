import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import logo from "@/assets/logo.webp";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CaseStudy } from "@/components/landing/CaseStudy";

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

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="Sportstalent — Sport Science Training for Taekwondo Athletes"
        description="Strength & conditioning built on taekwondo sport science. Periodized programs for explosive power, speed, and resilience."
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="text-xs text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> {t("help" as any)}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs font-semibold">
            {t("signIn")}
          </Button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <CaseStudy />
        <FeatureGrid />
      </main>

      <AppFooter />
    </div>
  );
};

export default Index;
