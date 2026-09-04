import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  /** ISO yyyy-mm-dd or "" */
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  minAge?: number;
  maxAge?: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Locale-aware date-of-birth picker built from three selects, so the
 * ordering follows Intl.DateTimeFormat for the active language
 * (day/month/year in DA/SV/DE/NO/ES, month/day/year in EN-US style, etc.).
 */
export function BirthDatePicker({ value, onChange, label, minAge = 3, maxAge = 100 }: Props) {
  const { t, locale } = useLanguage();

  // Keep partial selections locally; the parent only receives a complete ISO date.
  const parsed = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? { y: match[1], m: match[2], d: match[3] } : null;
  }, [value]);

  const [parts, setParts] = useState(() => parsed ?? { y: "", m: "", d: "" });

  useEffect(() => {
    if (parsed) setParts(parsed);
  }, [parsed]);

  const { y, m, d } = parts;

  const thisYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let yy = thisYear - minAge; yy >= thisYear - maxAge; yy--) arr.push(yy);
    return arr;
  }, [thisYear, minAge, maxAge]);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2020, i, 1)));
  }, [locale]);

  const daysInMonth = useMemo(() => {
    if (!y || !m) return 31;
    return new Date(Number(y), Number(m), 0).getDate();
  }, [y, m]);

  // Determine field order from the locale's own date pattern.
  const order = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat(locale, {
        year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(new Date(2020, 4, 9));
      return parts
        .filter((p) => p.type === "day" || p.type === "month" || p.type === "year")
        .map((p) => p.type as "day" | "month" | "year");
    } catch {
      return ["day", "month", "year"] as const as ("day" | "month" | "year")[];
    }
  }, [locale]);

  const emit = (next: { y?: string; m?: string; d?: string }) => {
    const ny = next.y ?? y;
    const nm = next.m ?? m;
    let nd = next.d ?? d;
    if (ny && nm && nd) {
      const max = new Date(Number(ny), Number(nm), 0).getDate();
      if (Number(nd) > max) nd = pad(max);
      onChange(`${ny}-${nm}-${nd}`);
    } else {
      onChange("");
    }
  };

  const fields: Record<"day" | "month" | "year", JSX.Element> = {
    day: (
      <Select key="day" value={d} onValueChange={(v) => emit({ d: v })}>
        <SelectTrigger className="h-11"><SelectValue placeholder="--" /></SelectTrigger>
        <SelectContent className="max-h-64">
          {Array.from({ length: daysInMonth }, (_, i) => pad(i + 1)).map((dd) => (
            <SelectItem key={dd} value={dd}>{Number(dd)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    month: (
      <Select key="month" value={m} onValueChange={(v) => emit({ m: v })}>
        <SelectTrigger className="h-11"><SelectValue placeholder="--" /></SelectTrigger>
        <SelectContent className="max-h-64">
          {monthNames.map((name, i) => (
            <SelectItem key={name} value={pad(i + 1)}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    year: (
      <Select key="year" value={y} onValueChange={(v) => emit({ y: v })}>
        <SelectTrigger className="h-11"><SelectValue placeholder="----" /></SelectTrigger>
        <SelectContent className="max-h-64">
          {years.map((yy) => (
            <SelectItem key={yy} value={String(yy)}>{yy}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  };

  return (
    <div className="space-y-2">
      <Label>{label || t("birthDateLabel")}</Label>
      <div className="grid grid-cols-3 gap-2">
        {order.map((key) => fields[key])}
      </div>
    </div>
  );
}
