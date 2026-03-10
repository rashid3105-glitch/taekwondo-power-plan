import { useMemo } from "react";

interface MentalRadarChartProps {
  scores: Record<string, number>;
  labels: Record<string, string>;
  maxScore?: number;
  size?: number;
}

export function MentalRadarChart({ scores, labels, maxScore = 5, size = 280 }: MentalRadarChartProps) {
  const entries = Object.entries(scores);
  const n = entries.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  const points = useMemo(() => {
    return entries.map(([, score], i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (score / maxScore) * radius;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }, [entries, n, cx, cy, radius, maxScore]);

  const gridLevels = [1, 2, 3, 4, 5];

  const axisPoints = useMemo(() => {
    return entries.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle };
    });
  }, [entries, n, cx, cy, radius]);

  const labelPositions = useMemo(() => {
    return entries.map(([key], i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelR = radius + 28;
      return {
        key,
        x: cx + labelR * Math.cos(angle),
        y: cy + labelR * Math.sin(angle),
        anchor: Math.abs(Math.cos(angle)) < 0.1 ? "middle" as const : Math.cos(angle) > 0 ? "start" as const : "end" as const,
      };
    });
  }, [entries, n, cx, cy, radius]);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const r = (level / maxScore) * radius;
        const gridPath = Array.from({ length: n }, (_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${i === 0 ? "M" : "L"}${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ") + "Z";
        return (
          <path key={level} d={gridPath} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
        );
      })}

      {/* Axis lines */}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
      ))}

      {/* Data polygon */}
      <path d={polygonPath} fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
      ))}

      {/* Labels */}
      {labelPositions.map((lp) => (
        <text
          key={lp.key}
          x={lp.x}
          y={lp.y}
          textAnchor={lp.anchor}
          dominantBaseline="central"
          className="fill-foreground text-[9px] font-semibold"
        >
          {labels[lp.key] || lp.key}
        </text>
      ))}

      {/* Score values */}
      {points.map((p, i) => (
        <text
          key={`val-${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          className="fill-primary text-[8px] font-bold"
        >
          {entries[i][1]}
        </text>
      ))}
    </svg>
  );
}

/**
 * Draw radar chart directly onto a jsPDF document for PDF export.
 */
export function drawRadarOnPDF(
  doc: any,
  scores: Record<string, number>,
  labels: Record<string, string>,
  centerX: number,
  centerY: number,
  radius: number = 40,
  maxScore: number = 5
) {
  const entries = Object.entries(scores);
  const n = entries.length;

  // Grid
  const gridLevels = [1, 2, 3, 4, 5];
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  for (const level of gridLevels) {
    const r = (level / maxScore) * radius;
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
    });
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % n];
      doc.line(x1, y1, x2, y2);
    }
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  }

  // Data polygon
  const dataPoints = entries.map(([, score], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (score / maxScore) * radius;
    return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
  });

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.setFillColor(30, 64, 175);

  for (let i = 0; i < n; i++) {
    const [x1, y1] = dataPoints[i];
    const [x2, y2] = dataPoints[(i + 1) % n];
    doc.line(x1, y1, x2, y2);
  }

  // Points
  dataPoints.forEach(([x, y]) => {
    doc.circle(x, y, 1.2, "F");
  });

  // Labels
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  entries.forEach(([key, score], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const labelR = radius + 12;
    const lx = centerX + labelR * Math.cos(angle);
    const ly = centerY + labelR * Math.sin(angle);
    const label = labels[key] || key;
    const align = Math.abs(Math.cos(angle)) < 0.1 ? "center" : Math.cos(angle) > 0 ? "left" : "right";
    doc.text(`${label} (${score})`, lx, ly, { align });
  });
}
