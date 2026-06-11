import { useNavigate } from "react-router-dom";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { ArrowLeft, FileText, ClipboardList, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useEffect } from "react";

export default function CoachSurveysHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasCoachRole, loading } = useRole();

  useEffect(() => {
    if (!loading && !hasCoachRole) navigate("/library", { replace: true });
  }, [loading, hasCoachRole, navigate]);

  const cards = [
    {
      key: "manage",
      label: t("surveysHubCreateTitle"),
      desc: t("surveysHubCreateDesc"),
      icon: ClipboardList,
      color: "text-primary",
      to: "/coach/surveys?view=manage",
    },
    {
      key: "results",
      label: t("surveysHubResultsTitle"),
      desc: t("surveysHubResultsDesc"),
      icon: BarChart3,
      color: "text-tab-progress",
      to: "/coach/surveys?view=results",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-card-foreground">{t("surveysTitle")}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-2">{t("surveysTitle")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("libSurveysDesc")}</p>

        <div className="grid gap-4">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate(c.to)}
              className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer text-left"
            >
              <div className="h-12 w-12 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-center shrink-0">
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <div>
                <div className="font-bold text-zinc-100 text-base">{c.label}</div>
                <div className="text-sm text-zinc-400">{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
