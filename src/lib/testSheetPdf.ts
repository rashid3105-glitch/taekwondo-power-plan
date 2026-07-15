// Generates a print-friendly PDF test sheet (one page-set per athlete) for a
// team test session. The PDF contains empty fields to be filled in by hand;
// coaches type the numbers into the app afterwards.

import type { TestDefinition, TestCategory } from "@/lib/testCatalog";
import type { Locale } from "@/i18n/translations";
import { localizedTestName } from "@/lib/testCatalog";

export interface SheetAthlete {
  id: string;
  name: string;
  birth_date?: string | null;
}

export interface SheetMeta {
  sessionName: string;
  sessionDate: string; // ISO
  clubName?: string | null;
  locale: Locale;
}

type L = Record<Locale, string>;

const S: Record<string, L> = {
  title: { en: "PERSONAL TEST SHEET", da: "PERSONLIGT TESTARK", sv: "PERSONLIGT TESTPROTOKOLL", de: "PERSÖNLICHER TESTBOGEN", ar: "ورقة اختبار شخصية", no: "PERSONLIG TESTARK", es: "HOJA DE TEST PERSONAL" },
  intro: {
    en: "Fill in your results by hand. The coach will enter them into the system afterwards.",
    da: "Udfyld dine resultater i hånden. Træneren indtaster dem i systemet bagefter.",
    sv: "Fyll i dina resultat för hand. Tränaren registrerar dem i systemet efteråt.",
    de: "Trage deine Ergebnisse per Hand ein. Der Trainer überträgt sie danach ins System.",
    ar: "املأ نتائجك يدويًا. سيقوم المدرب بإدخالها في النظام لاحقًا.",
    no: "Fyll ut resultatene dine for hånd. Treneren registrerer dem i systemet etterpå.",
    es: "Rellena tus resultados a mano. El entrenador los introducirá en el sistema después.",
  },
  personal: { en: "Personal information", da: "Personlige oplysninger", sv: "Personuppgifter", de: "Persönliche Angaben", ar: "المعلومات الشخصية", no: "Personopplysninger", es: "Datos personales" },
  fullName: { en: "Full name", da: "Fulde navn", sv: "Fullständigt namn", de: "Vollständiger Name", ar: "الاسم الكامل", no: "Fullt navn", es: "Nombre completo" },
  birthDate: { en: "Date of birth", da: "Fødselsdato", sv: "Födelsedatum", de: "Geburtsdatum", ar: "تاريخ الميلاد", no: "Fødselsdato", es: "Fecha de nacimiento" },
  sex: { en: "Sex", da: "Køn", sv: "Kön", de: "Geschlecht", ar: "الجنس", no: "Kjønn", es: "Sexo" },
  male: { en: "Male", da: "Mand", sv: "Man", de: "Mann", ar: "ذكر", no: "Mann", es: "Hombre" },
  female: { en: "Female", da: "Kvinde", sv: "Kvinna", de: "Frau", ar: "أنثى", no: "Kvinne", es: "Mujer" },
  height: { en: "Height (cm)", da: "Højde (cm)", sv: "Längd (cm)", de: "Größe (cm)", ar: "الطول (سم)", no: "Høyde (cm)", es: "Altura (cm)" },
  weight: { en: "Weight (kg)", da: "Vægt (kg)", sv: "Vikt (kg)", de: "Gewicht (kg)", ar: "الوزن (كجم)", no: "Vekt (kg)", es: "Peso (kg)" },
  weightNote: { en: "(confirmed on the day)", da: "(bekræftes på dagen)", sv: "(bekräftas på dagen)", de: "(am Tag bestätigt)", ar: "(يُؤكَّد في اليوم)", no: "(bekreftes på dagen)", es: "(confirmado el día)" },
  club: { en: "Club", da: "Klub", sv: "Klubb", de: "Verein", ar: "النادي", no: "Klubb", es: "Club" },
  team: { en: "Team / group", da: "Hold / gruppe", sv: "Lag / grupp", de: "Team / Gruppe", ar: "الفريق / المجموعة", no: "Lag / gruppe", es: "Equipo / grupo" },
  attempt: { en: "Attempt", da: "Forsøg", sv: "Försök", de: "Versuch", ar: "المحاولة", no: "Forsøk", es: "Intento" },
  best: { en: "Best", da: "Bedste", sv: "Bästa", de: "Bestes", ar: "الأفضل", no: "Beste", es: "Mejor" },
  result: { en: "Result", da: "Resultat", sv: "Resultat", de: "Ergebnis", ar: "النتيجة", no: "Resultat", es: "Resultado" },
  note: { en: "Note", da: "Note", sv: "Notering", de: "Notiz", ar: "ملاحظة", no: "Notat", es: "Nota" },
  overall: { en: "OVERALL FEEDBACK / NOTES", da: "SAMLET FEEDBACK / NOTER", sv: "SAMLAD FEEDBACK / ANTECKNINGAR", de: "GESAMTFEEDBACK / NOTIZEN", ar: "الملاحظات العامة", no: "SAMLET TILBAKEMELDING / NOTATER", es: "COMENTARIOS GENERALES / NOTAS" },
  privacyFooter: {
    en: "Please hand this sheet to your coach. All data is treated confidentially.",
    da: "Aflever arket til din træner. Alle oplysninger behandles fortroligt.",
    sv: "Lämna arket till din tränare. Alla uppgifter behandlas konfidentiellt.",
    de: "Gib dieses Blatt an deinen Trainer. Alle Daten werden vertraulich behandelt.",
    ar: "سلّم هذه الورقة إلى مدربك. تُعامَل جميع البيانات بسرية تامة.",
    no: "Lever arket til treneren din. Alle opplysninger behandles konfidensielt.",
    es: "Entrega esta hoja a tu entrenador. Todos los datos se tratan de forma confidencial.",
  },
  quality: { en: "Quality (1-5)", da: "Kvalitet (1-5)", sv: "Kvalitet (1-5)", de: "Qualität (1-5)", ar: "الجودة (1-5)", no: "Kvalitet (1-5)", es: "Calidad (1-5)" },
  total: { en: "Total", da: "Total", sv: "Totalt", de: "Gesamt", ar: "المجموع", no: "Totalt", es: "Total" },
  level: { en: "Level", da: "Level", sv: "Nivå", de: "Level", ar: "المستوى", no: "Nivå", es: "Nivel" },
  shuttles: { en: "Shuttles in last level", da: "Shuttles i sidste level", sv: "Shuttles i sista nivån", de: "Shuttles im letzten Level", ar: "الجولات في المستوى الأخير", no: "Shuttles i siste nivå", es: "Shuttles en el último nivel" },
  distanceM: { en: "Total distance (m)", da: "Samlet distance (m)", sv: "Total sträcka (m)", de: "Gesamtstrecke (m)", ar: "المسافة الإجمالية (م)", no: "Total distanse (m)", es: "Distancia total (m)" },
  interval: { en: "Interval", da: "Interval", sv: "Intervall", de: "Intervall", ar: "الفترة", no: "Intervall", es: "Intervalo" },
  category: {
    endurance: { en: "Endurance", da: "Udholdenhed", sv: "Uthållighet", de: "Ausdauer", ar: "التحمل", no: "Utholdenhet", es: "Resistencia" },
    speed: { en: "Speed", da: "Hurtighed", sv: "Snabbhet", de: "Schnelligkeit", ar: "السرعة", no: "Hurtighet", es: "Velocidad" },
    agility: { en: "Agility", da: "Agility", sv: "Agility", de: "Agilität", ar: "الرشاقة", no: "Agility", es: "Agilidad" },
    reaction: { en: "Reaction", da: "Reaktion", sv: "Reaktion", de: "Reaktion", ar: "رد الفعل", no: "Reaksjon", es: "Reacción" },
    muscular_endurance: { en: "Muscular endurance", da: "Muskeludholdenhed", sv: "Muskeluthållighet", de: "Muskelausdauer", ar: "التحمل العضلي", no: "Muskelutholdenhet", es: "Resistencia muscular" },
    power: { en: "Power", da: "Power", sv: "Power", de: "Power", ar: "القوة الانفجارية", no: "Power", es: "Potencia" },
    strength: { en: "Strength", da: "Styrke", sv: "Styrka", de: "Kraft", ar: "القوة", no: "Styrke", es: "Fuerza" },
    balance: { en: "Balance", da: "Balance", sv: "Balans", de: "Gleichgewicht", ar: "التوازن", no: "Balanse", es: "Equilibrio" },
    flexibility: { en: "Flexibility", da: "Fleksibilitet", sv: "Flexibilitet", de: "Flexibilität", ar: "المرونة", no: "Fleksibilitet", es: "Flexibilidad" },
  } as unknown as L,
};

function tr(key: keyof typeof S, locale: Locale): string {
  const v = S[key] as L;
  return v[locale] ?? v.en;
}
function catLabel(cat: TestCategory, locale: Locale): string {
  const map = (S.category as unknown) as Record<TestCategory, L>;
  return map[cat]?.[locale] ?? map[cat]?.en ?? cat;
}

// Rough classifiers for which template a test uses.
function isMultiAttempt(def: TestDefinition): boolean {
  // Distance-based power/agility tests are usually 2-3 attempts.
  if (def.category === "power" && def.inputType === "distance") return true;
  if (def.category === "agility" && def.inputType === "stopwatch") return true;
  if (def.category === "speed" && def.inputType === "stopwatch") return true;
  if (def.category === "flexibility") return true; // 2-3 attempts helpful
  return false;
}
function isKickTest(def: TestDefinition): boolean {
  return /kick|spark|patada|tritt|ركل/i.test(def.dbTestName) || /kick|spark/i.test(def.id);
}
function isBeepLike(def: TestDefinition): boolean {
  return def.inputType === "level" || /beep|yo-?yo/i.test(def.dbTestName);
}

export async function generateTestSheetsPdf(
  athletes: SheetAthlete[],
  tests: TestDefinition[],
  meta: SheetMeta,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const locale = meta.locale;

  const TEXT: [number, number, number] = [30, 41, 59];
  const MUTED: [number, number, number] = [110, 120, 135];
  const LINE: [number, number, number] = [180, 188, 200];
  const ACCENT: [number, number, number] = [14, 165, 233];

  let y = margin;
  let pageNumber = 1;

  const sorted = [...athletes].sort((a, b) => a.name.localeCompare(b.name, locale));

  function footer() {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `${meta.sessionName} · ${new Date(meta.sessionDate).toLocaleDateString(locale)} · ${pageNumber}`,
      pageW / 2,
      pageH - 7,
      { align: "center" },
    );
  }
  function newPage() {
    footer();
    doc.addPage();
    pageNumber += 1;
    y = margin;
  }
  function need(h: number) {
    if (y + h > pageH - 14) newPage();
  }

  function writeText(txt: string, x: number, yy: number, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; maxW?: number }) {
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setTextColor(...(opts?.color ?? TEXT));
    if (opts?.maxW) {
      const lines = doc.splitTextToSize(txt, opts.maxW) as string[];
      doc.text(lines, x, yy);
      return lines.length * (opts?.size ? opts.size * 0.4 : 4);
    }
    doc.text(txt, x, yy);
    return (opts?.size ?? 10) * 0.4;
  }

  function line(x1: number, y1: number, x2: number, y2: number, color: [number, number, number] = LINE) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.2);
    doc.line(x1, y1, x2, y2);
  }

  // Empty underline field for handwriting
  function fillLine(label: string, x: number, yy: number, width: number, prefilled?: string) {
    writeText(label + ":", x, yy, { size: 9, color: MUTED });
    const labelW = doc.getTextWidth(label + ": ") + 1;
    const startX = x + labelW;
    const endX = x + width;
    line(startX, yy + 1.2, endX, yy + 1.2);
    if (prefilled) {
      writeText(prefilled, startX + 1, yy, { size: 10, bold: true });
    }
  }

  function checkbox(x: number, yy: number, size = 3.2) {
    doc.setDrawColor(...TEXT);
    doc.setLineWidth(0.35);
    doc.rect(x, yy - size + 0.4, size, size);
  }

  function drawAthletePage(athlete: SheetAthlete) {
    y = margin;

    // Header block
    doc.setFillColor(...ACCENT);
    doc.rect(margin, y, contentW, 1, "F");
    y += 4;
    writeText(meta.sessionName, margin, y + 2, { size: 14, bold: true });
    y += 6;
    writeText(
      `${new Date(meta.sessionDate).toLocaleDateString(locale)}${meta.clubName ? " · " + meta.clubName : ""}`,
      margin, y + 2, { size: 9, color: MUTED },
    );
    y += 6;
    writeText(tr("title", locale), margin, y + 2, { size: 12, bold: true, color: ACCENT });
    y += 5;
    y += writeText(tr("intro", locale), margin, y + 2, { size: 9, color: MUTED, maxW: contentW });
    y += 3;

    // Personal info box
    const boxTop = y;
    writeText(tr("personal", locale), margin + 2, y + 4, { size: 9, bold: true, color: MUTED });
    y += 7;
    const colW = contentW / 2 - 2;
    // Row 1
    fillLine(tr("fullName", locale), margin + 2, y + 2, colW, athlete.name);
    fillLine(tr("birthDate", locale), margin + colW + 6, y + 2,
      colW, athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString(locale) : undefined);
    y += 7;
    // Row 2 - sex + height
    writeText(tr("sex", locale) + ":", margin + 2, y + 2, { size: 9, color: MUTED });
    const sexLabelW = doc.getTextWidth(tr("sex", locale) + ": ") + 1;
    checkbox(margin + 2 + sexLabelW, y + 2);
    writeText(tr("male", locale), margin + 2 + sexLabelW + 4.5, y + 2, { size: 9 });
    const mW = doc.getTextWidth(tr("male", locale)) + 6;
    checkbox(margin + 2 + sexLabelW + 4.5 + mW, y + 2);
    writeText(tr("female", locale), margin + 2 + sexLabelW + 9 + mW, y + 2, { size: 9 });
    fillLine(tr("height", locale), margin + colW + 6, y + 2, colW);
    y += 7;
    // Row 3 - weight + club
    fillLine(`${tr("weight", locale)} ${tr("weightNote", locale)}`, margin + 2, y + 2, colW);
    fillLine(tr("club", locale), margin + colW + 6, y + 2, colW, meta.clubName ?? undefined);
    y += 7;
    // Row 4 - team
    fillLine(tr("team", locale), margin + 2, y + 2, contentW - 4);
    y += 6;
    // Box outline
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.rect(margin, boxTop, contentW, y - boxTop);
    y += 4;

    // Group tests by category (preserving encounter order)
    const groups: Array<{ cat: TestCategory; items: TestDefinition[] }> = [];
    for (const t of tests) {
      let g = groups.find((x) => x.cat === t.category);
      if (!g) { g = { cat: t.category, items: [] }; groups.push(g); }
      g.items.push(t);
    }

    for (const grp of groups) {
      need(10);
      // Category header
      doc.setFillColor(240, 244, 249);
      doc.rect(margin, y, contentW, 5.5, "F");
      writeText(catLabel(grp.cat, locale).toUpperCase(), margin + 2, y + 4, { size: 9, bold: true, color: ACCENT });
      y += 7;

      for (const def of grp.items) {
        renderTestBlock(def);
      }
    }

    // Overall feedback
    need(35);
    writeText(tr("overall", locale), margin, y + 2, { size: 10, bold: true });
    y += 4;
    for (let i = 0; i < 4; i++) {
      line(margin, y + 4, margin + contentW, y + 4);
      y += 6;
    }
    y += 2;
    writeText(tr("privacyFooter", locale), margin, y + 2, { size: 8, color: MUTED, maxW: contentW });
  }

  function renderTestBlock(def: TestDefinition) {
    const protocol = def.protocols[locale] ?? def.protocols.en ?? "";
    // Estimate needed height
    const protoLines = doc.splitTextToSize(protocol, contentW - 4) as string[];
    const baseH = 10 + protoLines.length * 3.6 + 14;
    need(baseH);

    const blockTop = y;
    // Title bar
    writeText(localizedTestName(def, locale), margin + 2, y + 4, { size: 10, bold: true });
    writeText(`(${def.unit})`, margin + contentW - 2, y + 4, { size: 9, color: MUTED });
    // right-align unit
    const uw = doc.getTextWidth(`(${def.unit})`);
    doc.setFillColor(255, 255, 255);
    // remove the misplaced right-anchored draw above by redrawing white? Simpler: draw again positioned properly
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(`(${def.unit})`, margin + contentW - 2 - uw, y + 4);
    y += 6;

    if (protocol) {
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "italic");
      doc.text(protoLines, margin + 2, y + 2);
      doc.setFont("helvetica", "normal");
      y += protoLines.length * 3.3 + 1;
    }

    // Fields row
    const rowY = y + 4;
    const fieldH = 6;
    if (isKickTest(def)) {
      const cols = ["1", "2", "3", tr("total", locale), tr("quality", locale)];
      drawFieldRow(cols, rowY, fieldH);
    } else if (isBeepLike(def)) {
      const cols = [tr("level", locale), tr("shuttles", locale), tr("distanceM", locale)];
      drawFieldRow(cols, rowY, fieldH);
    } else if (isMultiAttempt(def)) {
      const cols = [`${tr("attempt", locale)} 1`, `${tr("attempt", locale)} 2`, `${tr("attempt", locale)} 3`, `${tr("best", locale)} (${def.unit})`];
      drawFieldRow(cols, rowY, fieldH);
    } else {
      const cols = [`${tr("result", locale)} (${def.unit})`];
      drawFieldRow(cols, rowY, fieldH);
    }
    y = rowY + fieldH + 2;

    // Note line
    writeText(tr("note", locale) + ":", margin + 2, y + 3, { size: 8, color: MUTED });
    const lblW = doc.getTextWidth(tr("note", locale) + ": ") + 3;
    line(margin + 2 + lblW, y + 3.5, margin + contentW - 2, y + 3.5);
    y += 5;

    // Block border
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.rect(margin, blockTop, contentW, y - blockTop);
    y += 3;
  }

  function drawFieldRow(labels: string[], yy: number, h: number) {
    const n = labels.length;
    const gap = 3;
    const cellW = (contentW - 4 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = margin + 2 + i * (cellW + gap);
      writeText(labels[i], x, yy - 0.5, { size: 8, color: MUTED });
      doc.setDrawColor(...TEXT);
      doc.setLineWidth(0.35);
      doc.rect(x, yy + 0.8, cellW, h);
    }
  }

  sorted.forEach((a, idx) => {
    if (idx > 0) newPage();
    drawAthletePage(a);
  });
  footer();

  const filename = `${meta.sessionName.replace(/[^\w\- ]+/g, "_")}_testark.pdf`;
  doc.save(filename);
}
