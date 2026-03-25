import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, UserCircle, ClipboardList, HeartPulse, Brain, Users, BarChart3, Clock, ChevronDown, Activity, Apple, TrendingUp, BookOpen, BookHeart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { cn } from "@/lib/utils";

const helpSections = [
  { key: "helpProfile", icon: UserCircle },
  { key: "helpTrainingPlan", icon: ClipboardList },
  { key: "helpPhysicalTesting", icon: Activity },
  { key: "helpProgress", icon: TrendingUp },
  { key: "helpNutrition", icon: Apple },
  { key: "helpRehabPlan", icon: HeartPulse },
  { key: "helpMentalPlan", icon: Brain },
  { key: "helpLibrary", icon: BookOpen },
  { key: "helpDiary", icon: BookHeart },
  { key: "helpAddStudents", icon: Users },
  { key: "helpStudentProgress", icon: BarChart3 },
] as const;

export default function Help() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative">
      <PageMeta title="Help Center" description="Get help with Sportstalent features and training tools." />
      <Watermark />
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <LanguageSwitcher />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{t("helpTitle" as any)}</h1>
          <p className="text-muted-foreground">{t("helpSubtitle" as any)}</p>
        </div>

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
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isActive ? "bg-primary-foreground/20" : "bg-secondary"
                )}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                </div>
                <span className="font-semibold text-sm">
                  {t(`${section.key}Title` as any)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expanded content for active section */}
        {activeSection && (
          <div className="rounded-lg border border-primary/30 bg-card px-5 py-4 animate-in fade-in-0 slide-in-from-top-2">
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(`${activeSection}Steps` as any)}
            </div>
          </div>
        )}

        {/* Changelog */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold text-foreground">{t("changelogTitle" as any)}</h2>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_24" as any)}</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                <li>{t("changelogEntry9" as any)}</li>
                <li>{t("changelogEntry10" as any)}</li>
                <li>{t("changelogEntry11" as any)}</li>
                <li>{t("changelogEntry12" as any)}</li>
                <li>{t("changelogEntry13" as any)}</li>
                <li>{t("changelogEntry14" as any)}</li>
                <li>{t("changelogEntry15" as any)}</li>
                <li>{t("changelogEntry16" as any)}</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3 mt-3">
              <h3 className="text-sm font-bold text-foreground">{t("changelog_2026_03_23" as any)}</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                <li>{t("changelogEntry1" as any)}</li>
                <li>{t("changelogEntry2" as any)}</li>
                <li>{t("changelogEntry3" as any)}</li>
                <li>{t("changelogEntry4" as any)}</li>
                <li>{t("changelogEntry5" as any)}</li>
                <li>{t("changelogEntry6" as any)}</li>
                <li>{t("changelogEntry7" as any)}</li>
                <li>{t("changelogEntry8" as any)}</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
