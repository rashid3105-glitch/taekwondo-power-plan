/**
 * Calendar export utilities — .ics file download & Google Calendar link generation
 */

import { normalizeDaySessions } from "@/lib/planSessionUtils";

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}

export function generateICSFile(events: CalendarEvent[], filename: string): void {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sportstalent//Training Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(event.endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description)}`,
      event.location ? `LOCATION:${escapeICS(event.location)}` : "",
      `UID:${crypto.randomUUID()}@tkdpower`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.filter(Boolean).join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${fmt(event.startDate)}/${fmt(event.endDate)}`,
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Map day-of-week name to the next occurrence from a given start date */
function getNextDayOfWeek(dayName: string, fromDate: Date): Date {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = days.indexOf(dayName.toLowerCase());
  if (target === -1) return fromDate;
  const current = fromDate.getDay();
  let diff = target - current;
  if (diff < 0) diff += 7;
  if (diff === 0) diff = 0; // same day is fine
  const result = new Date(fromDate);
  result.setDate(result.getDate() + diff);
  return result;
}

/** Build calendar events from a training plan's weekly schedule */
export function buildTrainingEvents(
  schedule: any[],
  planName: string,
  programWeeks: number = 4,
  startFrom: Date = new Date()
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const baseDate = new Date(startFrom);
  baseDate.setHours(0, 0, 0, 0);

  for (let week = 0; week < programWeeks; week++) {
    const weekStart = new Date(baseDate);
    weekStart.setDate(weekStart.getDate() + week * 7);

    for (const day of schedule) {
      const sessions = normalizeDaySessions(day);
      const dayDate = getNextDayOfWeek(day.dayOfWeek, weekStart);

      sessions.forEach((session: any, si: number) => {
        if (session.type === "rest" || session.type === "recovery") return;

        const startHour = si === 0 ? 9 : 17; // morning vs evening
        const startDate = new Date(dayDate);
        startDate.setHours(startHour, 0, 0, 0);
        const endDate = new Date(dayDate);
        endDate.setHours(startHour + 1, 30, 0, 0);

        const exerciseList = session.exercises?.length
          ? session.exercises.map((ex: any, i: number) => `${i + 1}. ${ex.name} — ${ex.sets}×${ex.reps}`).join("\n")
          : "Follow dojang programming";

        events.push({
          title: `${planName} — ${session.label || day.label}`,
          description: `${session.focus || ""}\n\n${exerciseList}`.trim(),
          startDate,
          endDate,
        });
      });
    }
  }

  return events;
}

/** Build a single day's calendar event */
export function buildDayEvent(
  day: any,
  planName: string,
  date?: Date,
  sessionIndex: number = 0
): CalendarEvent {
  const sessions = normalizeDaySessions(day);
  const session = sessions[sessionIndex] || sessions[0];
  const startHour = sessionIndex === 0 ? 9 : 17;
  const startDate = date ? new Date(date) : getNextDayOfWeek(day.dayOfWeek, new Date());
  startDate.setHours(startHour, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(startHour + 1, 30, 0, 0);

  const exerciseList = session.exercises?.length
    ? session.exercises.map((ex: any, i: number) => `${i + 1}. ${ex.name} — ${ex.sets}×${ex.reps}`).join("\n")
    : "Follow dojang programming";

  return {
    title: `${planName} — ${session.label || day.label}`,
    description: `${session.focus || ""}\n\n${exerciseList}`.trim(),
    startDate,
    endDate,
  };
}
