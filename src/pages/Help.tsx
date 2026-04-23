import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UserCircle, ClipboardList, HeartPulse, Brain, Users, BarChart3, Clock, ChevronDown, Activity, Apple, TrendingUp, BookOpen, BookHeart, Download, Video } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PublicNav } from "@/components/PublicNav";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { cn } from "@/lib/utils";

const helpSections = [
  { key: "helpProfile", icon: UserCircle, isNew: false },
  { key: "helpMatchAnalysis", icon: Video, isNew: true },
  { key: "helpTrainingPlan", icon: ClipboardList, isNew: false },
  { key: "helpPhysicalTesting", icon: Activity, isNew: false },
  { key: "helpProgress", icon: TrendingUp, isNew: false },
  { key: "helpNutrition", icon: Apple, isNew: false },
  { key: "helpRehabPlan", icon: HeartPulse, isNew: false },
  { key: "helpMentalPlan", icon: Brain, isNew: false },
  { key: "helpLibrary", icon: BookOpen, isNew: false },
  { key: "helpDiary", icon: BookHeart, isNew: false },
  { key: "helpAddStudents", icon: Users, isNew: false },
  { key: "helpStudentProgress", icon: BarChart3, isNew: false },
] as const;

export default function Help() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta title="Help Center" description="Get help with Sportstalent features and training tools." canonical="https://sportstalent.dk/help" />
      <Watermark />

      <PublicNav />

      {/* Header */}
      <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{t("helpTitle")}</h1>
          <p className="text-muted-foreground">{t("helpSubtitle")}</p>
        </div>
      </div>
      </div>

      {/* Gradient transition */}
      <div className="h-16 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

      <div className="theme-light-section px-4 pb-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Topic buttons grid */}
        <div className="grid grid-cols-2 gap-3">
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(isActive ? null : section.key)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted shadow-sm"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isActive ? "bg-primary-foreground/20" : "bg-secondary"
                )}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                </div>
                <span className="font-semibold text-sm">
                  {t(`${section.key}Title`)}
                </span>
                {section.isNew && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}>
                    {t("newBadge")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded content for active section */}
        {activeSection && (
          <div className="rounded-lg border border-primary/30 bg-card px-5 py-4 animate-in fade-in-0 slide-in-from-top-2 shadow-sm">
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(`${activeSection}Steps`)}
            </div>
          </div>
        )}

        {/* Install as app */}
        <button
          onClick={() => navigate("/install")}
          className="w-full flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 text-left transition-colors shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-foreground">{t("installLink")}</div>
            <div className="text-xs text-muted-foreground">{t("installSubtitle")}</div>
          </div>
        </button>

        {/* Changelog */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold text-foreground">{t("changelogTitle")}</h2>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_23")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry74")}</li>
                  <li>{t("changelogEntry75")}</li>
                  <li>{t("changelogEntry76")}</li>
                  <li>{t("changelogEntry77")}</li>
                  <li>{t("changelogEntry78")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_22")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry67")}</li>
                  <li>{t("changelogEntry68")}</li>
                  <li>{t("changelogEntry69")}</li>
                  <li>{t("changelogEntry70")}</li>
                  <li>{t("changelogEntry71")}</li>
                  <li>{t("changelogEntry72")}</li>
                  <li>{t("changelogEntry73")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_20")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry63")}</li>
                  <li>{t("changelogEntry64")}</li>
                  <li>{t("changelogEntry65")}</li>
                  <li>{t("changelogEntry66")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_16")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry57")}</li>
                  <li>{t("changelogEntry58")}</li>
                  <li>{t("changelogEntry59")}</li>
                  <li>{t("changelogEntry60")}</li>
                  <li>{t("changelogEntry61")}</li>
                  <li>{t("changelogEntry62")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_10")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry52")}</li>
                  <li>{t("changelogEntry53")}</li>
                  <li>{t("changelogEntry54")}</li>
                  <li>{t("changelogEntry55")}</li>
                  <li>{t("changelogEntry56")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_06")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry46")}</li>
                  <li>{t("changelogEntry47")}</li>
                  <li>{t("changelogEntry48")}</li>
                  <li>{t("changelogEntry49")}</li>
                  <li>{t("changelogEntry50")}</li>
                  <li>{t("changelogEntry51")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_04_01")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry40")}</li>
                  <li>{t("changelogEntry41")}</li>
                  <li>{t("changelogEntry42")}</li>
                  <li>{t("changelogEntry43")}</li>
                  <li>{t("changelogEntry44")}</li>
                  <li>{t("changelogEntry45")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_30")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry35")}</li>
                  <li>{t("changelogEntry36")}</li>
                  <li>{t("changelogEntry37")}</li>
                  <li>{t("changelogEntry38")}</li>
                  <li>{t("changelogEntry39")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_28")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry29")}</li>
                  <li>{t("changelogEntry30")}</li>
                  <li>{t("changelogEntry31")}</li>
                  <li>{t("changelogEntry32")}</li>
                  <li>{t("changelogEntry33")}</li>
                  <li>{t("changelogEntry34")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_25")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry17")}</li>
                  <li>{t("changelogEntry18")}</li>
                  <li>{t("changelogEntry19")}</li>
                  <li>{t("changelogEntry20")}</li>
                  <li>{t("changelogEntry21")}</li>
                  <li>{t("changelogEntry22")}</li>
                  <li>{t("changelogEntry23")}</li>
                  <li>{t("changelogEntry24")}</li>
                  <li>{t("changelogEntry25")}</li>
                  <li>{t("changelogEntry26")}</li>
                  <li>{t("changelogEntry27")}</li>
                  <li>{t("changelogEntry28")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_24")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry9")}</li>
                  <li>{t("changelogEntry10")}</li>
                  <li>{t("changelogEntry11")}</li>
                  <li>{t("changelogEntry12")}</li>
                  <li>{t("changelogEntry13")}</li>
                  <li>{t("changelogEntry14")}</li>
                  <li>{t("changelogEntry15")}</li>
                  <li>{t("changelogEntry16")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_23")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t("changelogEntry1")}</li>
                  <li>{t("changelogEntry2")}</li>
                  <li>{t("changelogEntry3")}</li>
                  <li>{t("changelogEntry4")}</li>
                  <li>{t("changelogEntry5")}</li>
                  <li>{t("changelogEntry6")}</li>
                  <li>{t("changelogEntry7")}</li>
                  <li>{t("changelogEntry8")}</li>
                </ul>
              </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      </div>
    </div>
  );
}
