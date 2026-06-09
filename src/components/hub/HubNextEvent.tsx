import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface NextEvent {
  name: string;
  event_date: string;
  location: string | null;
  priority: string;
}

interface Props {
  event: NextEvent | null;
}

function computeCountdown(eventDateIso: string) {
  const target = new Date(eventDateIso + "T09:00:00");
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return { days, hours, minutes };
}

export function HubNextEvent({ event }: Props) {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!event) return;
    const id = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, [event]);

  if (!event) return null;

  const { days, hours, minutes } = computeCountdown(event.event_date);
  const dateLabel = new Date(event.event_date + "T00:00:00").toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  const sub = [event.location, dateLabel].filter(Boolean).join(" · ");

  const cells: { value: string; label: string }[] = [
    { value: String(days).padStart(2, "0"), label: t("daysShort") },
    { value: String(hours).padStart(2, "0"), label: t("hoursShort") },
    { value: String(minutes).padStart(2, "0"), label: t("minutesShort") },
  ];

  return (
    <button
      type="button"
      onClick={() => navigate("/competitions")}
      className="group w-full text-left relative overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-primary bg-card/80 backdrop-blur-sm p-4 shadow-card transition-all hover:border-primary/40"
      aria-label={`${t("nextEventTitle")}: ${event.name}`}
    >
      <div className="flex items-center gap-3">
        <Trophy className="h-4 w-4 text-primary shrink-0 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {t("nextEventTitle")}
          </p>
          <p className="text-base font-bold text-card-foreground truncate mt-0.5">{event.name}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {cells.map((c, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-lg bg-secondary/50 border border-border/60 px-2 py-1 min-w-[42px]"
            >
              <span className="text-base sm:text-lg font-extrabold text-destructive leading-none">
                {c.value}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
