// Genererer en Word-udgave (.docx) af klubanalyse-rapporten,
// i samme opbygning som den rapport der sendes på mail.
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageOrientation,
  Paragraph,
  TextRun,
} from "docx";

export interface ClubAssessmentDocxInput {
  clubName: string;
  email: string;
  metaLine: string;
  analysis: string | null;
  dimensions: Array<{ name: string; score: string }>;
  answers?: Array<{ question: string; answer: string }>;
  radarSvg?: SVGSVGElement | null;
}

const GOLD = "B08D1F";

/** Tegner et on-page SVG om til en PNG (Uint8Array) så det kan lægges i Word. */
async function svgToPng(
  svg: SVGSVGElement,
  scale = 2,
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    const rect = svg.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || 480));
    const height = Math.max(1, Math.round(rect.height || 288));

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    let markup = new XMLSerializer().serializeToString(clone);
    // CSS-variabler kan ikke opløses uden for siden — erstat med faste farver.
    markup = markup
      .replace(/hsl\(var\(--border\)\)/g, "#c9c9c9")
      .replace(/hsl\(var\(--muted-foreground\)\)/g, "#555555")
      .replace(/hsl\(var\([^)]*\)\)/g, "#555555")
      .replace(/var\([^)]*\)/g, "#555555");

    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg load"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { data: bytes, width, height };
  } catch {
    return null;
  }
}

/** Deler **fed** tekst op i runs. */
function runs(text: string, opts: { size?: number; color?: string } = {}) {
  const size = opts.size ?? 22;
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map(
      (part) =>
        new TextRun({
          text: part.startsWith("**") && part.endsWith("**") ? part.slice(2, -2) : part,
          bold: part.startsWith("**") && part.endsWith("**"),
          size,
          color: opts.color,
        }),
    );
}

function analysisParagraphs(text: string): Paragraph[] {
  const out: Paragraph[] = [];
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        out.push(
          new Paragraph({
            spacing: { before: 260, after: 100 },
            children: [new TextRun({ text: heading[2], bold: true, size: 24, color: GOLD })],
          }),
        );
        return;
      }

      const bullet = line.match(/^[-*•]\s+(.*)$/);
      if (bullet) {
        out.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 80 },
            children: runs(bullet[1]),
          }),
        );
        return;
      }

      const numbered = line.match(/^\d+[.)]\s+(.*)$/);
      if (numbered) {
        out.push(
          new Paragraph({
            numbering: { reference: "numbers", level: 0 },
            spacing: { after: 80 },
            children: runs(numbered[1]),
          }),
        );
        return;
      }

      out.push(new Paragraph({ spacing: { after: 120 }, children: runs(line) }));
    });
  return out;
}

export async function downloadClubAssessmentDocx(input: ClubAssessmentDocxInput): Promise<void> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${input.clubName} — ${input.email}`, bold: true, size: 30 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: input.metaLine, size: 20, color: "555555" })],
    }),
  );

  const png = input.radarSvg ? await svgToPng(input.radarSvg) : null;
  if (png) {
    const w = 440;
    const h = Math.round((png.height / png.width) * w);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new ImageRun({
            type: "png",
            data: png.data,
            transformation: { width: w, height: h },
            altText: { title: "Profil", description: "Klubprofil", name: "profil" },
          }),
        ],
      }),
    );
  }

  if (input.dimensions.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 100 },
        children: [new TextRun({ text: "Dimensioner", bold: true, size: 24, color: GOLD })],
      }),
    );
    input.dimensions.forEach((d) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${d.name}: `, size: 22 }),
            new TextRun({ text: d.score, bold: true, size: 22 }),
          ],
        }),
      );
    });
  }

  if (input.analysis) {
    children.push(...analysisParagraphs(input.analysis));
  }

  if (input.answers && input.answers.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: "Svar pr. spørgsmål", bold: true, size: 24, color: GOLD })],
      }),
    );
    input.answers.forEach((a, i) => {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: `${i + 1}. ${a.question}`, size: 20, color: "555555" })],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `→ ${a.answer}`, size: 22 })],
        }),
      );
    });
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safe = `${input.clubName || "klubanalyse"} - ${input.email}`
    .replace(/[^\p{L}\p{N}@._ -]/gu, "")
    .trim()
    .replace(/\s+/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe || "klubanalyse"}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
