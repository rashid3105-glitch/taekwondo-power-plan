// Generates a printable PDF of a running program: header with goal distance,
// optional goal time / goal pace, then every week with its sessions and blank
// note fields for the athlete to fill in by hand.

import type { RunProgram } from "@/data/runningPrograms";
import { fmtDuration, fmtPace } from "@/data/runningPrograms";
import type { Locale } from "@/i18n/translations";

type L = Record<Locale, string>;

const S: Record<string, L> = {
  title: { en: "RUNNING PROGRAM", da: "LØBEPROGRAM", sv: "LÖPPROGRAM", de: "LAUFPROGRAMM", ar: "برنامج الجري", no: "LØPEPROGRAM", es: "PROGRAMA DE CARRERA" },
  goalDistance: { en: "Goal distance", da: "Måldistance", sv: "Måldistans", de: "Zieldistanz", ar: "المسافة المستهدفة", no: "Måldistanse", es: "Distancia objetivo" },
  goalTime: { en: "Goal time", da: "Måltid", sv: "Måltid", de: "Zielzeit", ar: "الزمن المستهدف", no: "Måltid", es: "Tiempo objetivo" },
  goalPace: { en: "Goal pace", da: "Måltempo", sv: "Måltempo", de: "Zieltempo", ar: "الوتيرة المستهدفة", no: "Måltempo", es: "Ritmo objetivo" },
  weeks: { en: "Weeks", da: "Uger", sv: "Veckor", de: "Wochen", ar: "الأسابيع", no: "Uker", es: "Semanas" },
  level: { en: "Level", da: "Niveau", sv: "Nivå", de: "Niveau", ar: "المستوى", no: "Nivå", es: "Nivel" },
  startDate: { en: "Start date", da: "Startdato", sv: "Startdatum", de: "Startdatum", ar: "تاريخ البدء", no: "Startdato", es: "Fecha de inicio" },
  week: { en: "Week", da: "Uge", sv: "Vecka", de: "Woche", ar: "الأسبوع", no: "Uke", es: "Semana" },
  day: { en: "Day", da: "Dag", sv: "Dag", de: "Tag", ar: "اليوم", no: "Dag", es: "Día" },
  notes: { en: "Actual (km / time)", da: "Faktisk (km / tid)", sv: "Faktiskt (km / tid)", de: "Tatsächlich (km / Zeit)", ar: "الفعلي (كم / الوقت)", no: "Faktisk (km / tid)", es: "Real (km / tiempo)" },
  current: { en: "CURRENT WEEK", da: "AKTUEL UGE", sv: "AKTUELL VECKA", de: "AKTUELLE WOCHE", ar: "الأسبوع الحالي", no: "GJELDENDE UKE", es: "SEMANA ACTUAL" },
  levels: { en: "beginner / intermediate / advanced", da: "begynder / øvet / avanceret", sv: "nybörjare / medel / avancerad", de: "Anfänger / Fortgeschritten / Profi", ar: "مبتدئ / متوسط / متقدم", no: "nybegynner / øvet / avansert", es: "principiante / intermedio / avanzado" },
};

const LEVEL_LABEL: Record<string, L> = {
  beginner: { en: "Beginner", da: "Begynder", sv: "Nybörjare", de: "Anfänger", ar: "مبتدئ", no: "Nybegynner", es: "Principiante" },
  intermediate: { en: "Intermediate", da: "Øvet", sv: "Medel", de: "Fortgeschritten", ar: "متوسط", no: "Øvet", es: "Intermedio" },
  advanced: { en: "Advanced", da: "Avanceret", sv: "Avancerad", de: "Profi", ar: "متقدم", no: "Avansert", es: "Avanzado" },
};

// jsPDF core fonts cover Latin only; strip characters they cannot render.
function safe(text: string, locale: Locale): string {
  if (locale !== "ar") return text;
  return text.replace(/[\u0600-\u06FF]/g, "").trim();
}

export interface RunPdfMeta {
  locale: Locale;
  programName: string;
  startDate?: string | null;
  currentWeek?: number | null;
}

export async function downloadRunningProgramPdf(program: RunProgram, meta: RunPdfMeta): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const loc: Locale = meta.locale === "ar" ? "en" : meta.locale;
  const s = (key: keyof typeof S) => safe(S[key][loc], loc);

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(s("title"), margin, y + 6);
  y += 12;

  doc.setFontSize(12);
  doc.text(meta.programName, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const facts: string[] = [
    `${s("goalDistance")}: ${program.goalKm} km`,
    `${s("weeks")}: ${program.weeks}`,
    `${s("level")}: ${safe(LEVEL_LABEL[program.level]?.[loc] ?? program.level, loc)}`,
  ];
  if (program.goalSeconds) {
    facts.splice(1, 0, `${s("goalTime")}: ${fmtDuration(program.goalSeconds)}`);
    facts.splice(2, 0, `${s("goalPace")}: ${fmtPace(program.goalSeconds / program.goalKm)}/km`);
  }
  if (meta.startDate) facts.push(`${s("startDate")}: ${meta.startDate}`);

  for (const line of facts) {
    doc.text(line, margin, y);
    y += 5;
  }

  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Weeks
  for (const w of program.plan) {
    ensureSpace(14 + w.sessions.length * 8);

    const isCurrent = meta.currentWeek === w.week;
    doc.setFillColor(isCurrent ? 232 : 244, isCurrent ? 245 : 244, isCurrent ? 233 : 244);
    doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${s("week")} ${w.week}`, margin + 2, y + 1.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const right = isCurrent ? `${w.totalKm} km  ·  ${s("current")}` : `${w.totalKm} km`;
    doc.text(right, pageW - margin - 2, y + 1.5, { align: "right" });
    y += 10;

    doc.setFontSize(9);
    for (const sess of w.sessions) {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${s("day")} ${sess.day} · ${safe(sess.focus, loc)}`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      const detail = doc.splitTextToSize(safe(sess.detail, loc), pageW - margin * 2 - 62);
      doc.text(detail, margin + 42, y);
      const lines = Array.isArray(detail) ? detail.length : 1;

      // blank note field
      doc.setDrawColor(200);
      doc.line(pageW - margin - 34, y - 0.6, pageW - margin, y - 0.6);
      doc.setFontSize(6.5);
      doc.setTextColor(140);
      doc.text(s("notes"), pageW - margin - 34, y + 2.4);

      doc.setTextColor(0);
      doc.setFontSize(9);

      y += Math.max(lines * 4.2, 7) + 2;
    }
    y += 3;
  }

  const fileName = `${meta.programName.replace(/[^\w\d-]+/g, "-").toLowerCase()}.pdf`;
  doc.save(fileName);
}
