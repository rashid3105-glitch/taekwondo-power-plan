import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, UserCircle, ClipboardList, HeartPulse, Brain, Users, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";

const helpSections = [
  { key: "helpProfile", icon: UserCircle },
  { key: "helpTrainingPlan", icon: ClipboardList },
  { key: "helpRehabPlan", icon: HeartPulse },
  { key: "helpMentalPlan", icon: Brain },
  { key: "helpAddStudents", icon: Users },
  { key: "helpStudentProgress", icon: BarChart3 },
] as const;

export default function Help() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative">
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

        <Accordion type="multiple" className="space-y-3">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <AccordionItem
                key={section.key}
                value={section.key}
                className="rounded-lg border border-border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline gap-3">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">
                      {t(`${section.key}Title` as any)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1 pl-12">
                  <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {t(`${section.key}Steps` as any)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
