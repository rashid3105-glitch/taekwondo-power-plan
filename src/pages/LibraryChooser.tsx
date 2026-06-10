import { useNavigate } from "react-router-dom";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { Dumbbell, Brain, UtensilsCrossed, ClipboardList, ArrowLeft, BookOpen, Zap, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import type { TranslationKey } from "@/i18n/translations";

const libraries: {
  id: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: typeof Dumbbell;
  color: string;
  bgClass: string;
}[] = [
  {
    id: "exercise",
    labelKey: "libExerciseLabel",
    descKey: "libExerciseDesc",
    icon: Dumbbell,
    color: "text-primary",
    bgClass: "bg-primary/10 border-primary/20 hover:border-primary/40",
  },
  {
    id: "mental",
    labelKey: "libMentalLabel",
    descKey: "libMentalDesc",
    icon: Brain,
    color: "text-tab-mental",
    bgClass: "bg-tab-mental/10 border-tab-mental/20 hover:border-tab-mental/40",
  },
  {
    id: "nutrition",
    labelKey: "libNutritionLabel",
    descKey: "libNutritionDesc",
    icon: UtensilsCrossed,
    color: "text-tab-nutrition",
    bgClass: "bg-tab-nutrition/10 border-tab-nutrition/20 hover:border-tab-nutrition/40",
  },
  {
    id: "testing",
    labelKey: "libTestingLabel",
    descKey: "libTestingDesc",
    icon: ClipboardList,
    color: "text-primary",
    bgClass: "bg-primary/10 border-primary/20 hover:border-primary/40",
  },
  {
    id: "hiit",
    labelKey: "libHiitLabel",
    descKey: "libHiitDesc",
    icon: Zap,
    color: "text-destructive",
    bgClass: "bg-destructive/10 border-destructive/20 hover:border-destructive/40",
  },
  {
    id: "supplement",
    labelKey: "libSupplementLabel",
    descKey: "libSupplementDesc",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgClass: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
  },
];

export default function LibraryChooser() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasCoachRole } = useRole();

  const visibleLibraries = hasCoachRole
    ? [
        ...libraries,
        {
          id: "surveys",
          labelKey: "libSurveysLabel" as TranslationKey,
          descKey: "libSurveysDesc" as TranslationKey,
          icon: FileText,
          color: "text-primary",
          bgClass: "bg-primary/10 border-primary/20 hover:border-primary/40",
        },
      ]
    : libraries;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-card-foreground">{t("library")}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-2">{t("chooseLibrary")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("chooseLibraryDesc")}
        </p>

        <div className="grid gap-4">
          {visibleLibraries.map((lib) => (
            <button
              key={lib.id}
              onClick={() => navigate(`/library/${lib.id}`)}
              className={`flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer text-left ${lib.bgClass}`}
            >
              <div className="h-12 w-12 rounded-lg bg-card flex items-center justify-center shrink-0">
                <lib.icon className={`h-6 w-6 ${lib.color}`} />
              </div>
              <div>
                <div className="font-bold text-card-foreground text-base">{t(lib.labelKey)}</div>
                <div className="text-sm text-muted-foreground">{t(lib.descKey)}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
