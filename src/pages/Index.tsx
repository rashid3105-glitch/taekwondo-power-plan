import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, Target, Shield, Dumbbell, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-energy shadow-glow">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            {t("heroTitle")} <span className="text-gradient-energy">{t("heroHighlight")}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("heroDescription")}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("personalized")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Dumbbell className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("aiGenerated")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Shield className="h-5 w-5 text-speed mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("tkdSpecific")}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={() => navigate("/auth")} size="lg">
              {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          {t("footerText")}
        </p>
      </footer>
    </div>
  );
};

export default Index;
