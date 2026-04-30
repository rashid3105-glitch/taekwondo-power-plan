import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Source {
  id: string;
  name: string;
  steps: { sleep: string; rhr: string; hrv: string; steps: string };
}

const SOURCES: Source[] = [
  {
    id: "apple",
    name: "Apple Health (iPhone / Apple Watch)",
    steps: {
      sleep: "Browse → Sleep → look at last night's “Time Asleep”.",
      rhr: "Browse → Heart → Resting Heart Rate.",
      hrv: "Browse → Heart → Heart Rate Variability (RMSSD, ms).",
      steps: "Browse → Activity → Steps (today's total).",
    },
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    steps: {
      sleep: "Health Stats → Sleep → total sleep hours.",
      rhr: "Health Stats → Heart Rate → 7-day Resting HR.",
      hrv: "Health Stats → HRV Status → last night value (ms).",
      steps: "Today screen → Steps tile.",
    },
  },
  {
    id: "polar",
    name: "Polar Flow / Polar Beat",
    steps: {
      sleep: "Diary → Nightly Recharge → sleep duration.",
      rhr: "Daily activity → Resting heart rate.",
      hrv: "Nightly Recharge → ANS charge → HRV (RMSSD).",
      steps: "Diary → Daily activity → Steps.",
    },
  },
  {
    id: "fitbit",
    name: "Fitbit",
    steps: {
      sleep: "Today → Sleep → hours slept.",
      rhr: "Today → Heart → Resting Heart Rate.",
      hrv: "Today → Health Metrics → HRV (ms).",
      steps: "Today → Steps tile.",
    },
  },
  {
    id: "samsung",
    name: "Samsung Health / Galaxy Watch",
    steps: {
      sleep: "Sleep tile → last night's score and hours.",
      rhr: "Heart rate → Resting heart rate.",
      hrv: "Stress → HRV reading (ms).",
      steps: "Steps tile → today's count.",
    },
  },
  {
    id: "whoop",
    name: "Whoop",
    steps: {
      sleep: "Sleep → hours of sleep.",
      rhr: "Recovery → Resting Heart Rate.",
      hrv: "Recovery → HRV (ms).",
      steps: "Whoop doesn't track steps — leave blank or use phone pedometer.",
    },
  },
  {
    id: "oura",
    name: "Oura Ring",
    steps: {
      sleep: "Sleep → Total Sleep.",
      rhr: "Readiness → Resting Heart Rate.",
      hrv: "Readiness → HRV Balance (Avg HRV).",
      steps: "Activity → Steps.",
    },
  },
];

export function HealthSourceGuide() {
  const { t } = useLanguage();
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {t("healthGuideTitle" as any) || "Where to find these numbers"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("healthGuideHint" as any) ||
            "Pick your device — we'll point you to the exact screen."}
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {SOURCES.map((s) => (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger className="text-sm">{s.name}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><strong className="text-foreground">Sleep:</strong> {s.steps.sleep}</li>
                  <li><strong className="text-foreground">Resting HR:</strong> {s.steps.rhr}</li>
                  <li><strong className="text-foreground">HRV:</strong> {s.steps.hrv}</li>
                  <li><strong className="text-foreground">Steps:</strong> {s.steps.steps}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("healthGuideGeneric" as any) ||
            "Don't see your device? Open its companion app and look for the daily summary screen — copy the four numbers."}
        </p>
      </CardContent>
    </Card>
  );
}
