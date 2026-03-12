import { useState } from "react";
import { CalendarPlus, Download as DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { generateICSFile, getGoogleCalendarUrl, buildTrainingEvents, buildDayEvent } from "@/lib/calendarExport";

interface CalendarDropdownProps {
  plan: { name: string; plan_data: any };
  /** If provided, show calendar for a single day */
  dayIndex?: number;
}

export function CalendarDropdown({ plan, dayIndex }: CalendarDropdownProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const schedule = plan.plan_data?.weeklySchedule || [];
  const programWeeks = plan.plan_data?.programWeeks || 4;

  const handleDownloadICS = () => {
    if (dayIndex !== undefined && schedule[dayIndex]) {
      const event = buildDayEvent(schedule[dayIndex], plan.name);
      generateICSFile([event], `${plan.name}_${schedule[dayIndex].dayOfWeek}`);
    } else {
      const events = buildTrainingEvents(schedule, plan.name, programWeeks);
      generateICSFile(events, plan.name);
    }
    toast({ title: t("calendarExported") });
  };

  const handleGoogleCalendar = () => {
    if (dayIndex !== undefined && schedule[dayIndex]) {
      const event = buildDayEvent(schedule[dayIndex], plan.name);
      window.open(getGoogleCalendarUrl(event), "_blank");
    } else {
      // For all sessions, open first event and download ICS for the rest
      const events = buildTrainingEvents(schedule, plan.name, programWeeks);
      if (events.length > 0) {
        window.open(getGoogleCalendarUrl(events[0]), "_blank");
        if (events.length > 1) {
          generateICSFile(events, plan.name);
          toast({ title: t("calendarExported"), description: "Full schedule also downloaded as .ics" });
          return;
        }
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title={t("addToCalendar")}>
          <CalendarPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">{dayIndex !== undefined ? "" : t("addToCalendar")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={handleDownloadICS}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors text-left cursor-pointer"
          >
            <DownloadIcon className="h-4 w-4 text-muted-foreground" />
            {t("downloadICS")}
          </button>
          <button
            onClick={handleGoogleCalendar}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors text-left cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4 text-primary" />
            {t("openInGoogleCalendar")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
