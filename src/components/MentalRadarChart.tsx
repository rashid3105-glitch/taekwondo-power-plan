import { useMemo, useState } from "react";

interface MentalRadarChartProps {
  scores: Record<string, number>;
  labels: Record<string, string>;
  previousScores?: Record<string, number>;
  maxScore?: number;
  size?: number;
}

const SCORE_COLORS = {
  high: "hsl(160, 80%, 45%)",
  mid: "hsl(35, 100%, 55%)",
  low: "hsl(0, 70%, 55%)",
};

export function MentalRadarChart({ scores, labels, previousScores, maxScore = 5, size = 300 }: MentalRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const entries = Object.entries(scores);
  const n = entries.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  const points = useMemo(() => {
    return entries.map(([, score], i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (score / maxScore) * radius;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }, [entries, n, cx, cy, radius, maxScore]);

  const prevPoints = useMemo(() => {
    if (!previousScores) return null;
    return entries.map(([key], i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const score = previousScores[key] ?? 0;
      const r = (score / maxScore) * radius;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }, [previousScores, entries, n, cx, cy, radius, maxScore]);

  const gridLevels = [1, 2, 3, 4, 5];

  const axisPoints = useMemo(() => {
    return entries.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle };
    });
  }, [entries, n, cx, cy, radius]);

  const labelPositions = useMemo(() => {
    return entries.map(([key, score], i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelR = radius + 32;
      return {
        key,
        score,
        x: cx + labelR * Math.cos(angle),
        y: cy + labelR * Math.sin(angle),
        anchor: Math.abs(Math.cos(angle)) < 0.1 ? "middle" as const : Math.cos(angle) > 0 ? "start" as const : "end" as const,
      };
    });
  }, [entries, n, cx, cy, radius]);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
  const prevPolygonPath = prevPoints ? prevPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z" : null;

  const getScoreColor = (score: number) => {
    if (score >= 4) return SCORE_COLORS.high;
    if (score >= 3) return SCORE_COLORS.mid;
    return SCORE_COLORS.low;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      <defs>
        <radialGradient id="radar-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={radius} fill="url(#radar-bg)" />

      {/* Grid rings with level labels */}
      {gridLevels.map((level) => {
        const r = (level / maxScore) * radius;
        const gridPath = Array.from({ length: n }, (_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${i === 0 ? "M" : "L"}${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ") + "Z";
        return (
          <g key={level}>
            <path d={gridPath} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
            <text x={cx + 4} y={cy - r + 3} className="fill-muted-foreground text-[7px]" opacity={0.4}>{level}</text>
          </g>
        );
      })}

      {/* Axis lines */}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
      ))}

      {/* Previous assessment overlay */}
      {prevPolygonPath && (
        <path d={prevPolygonPath} fill="hsl(var(--muted-foreground))" fillOpacity={0.06} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.3} />
      )}

      {/* Data polygon with gradient fill */}
      <path d={polygonPath} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2.5} filter="url(#glow)" />

      {/* Data points with score-colored rings */}
      {points.map((p, i) => {
        const score = entries[i][1];
        const isHovered = hoveredIndex === i;
        return (
          <g key={i}>
            {/* Hover target (larger invisible circle) */}
            <circle
              cx={p.x} cy={p.y} r={12} fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            />
            {/* Outer ring colored by score */}
            <circle cx={p.x} cy={p.y} r={isHovered ? 7 : 5.5} fill={getScoreColor(score)} fillOpacity={0.3} />
            {/* Inner dot */}
            <circle cx={p.x} cy={p.y} r={isHovered ? 5 : 4} fill={getScoreColor(score)} stroke="hsl(var(--background))" strokeWidth={2} />
          </g>
        );
      })}

      {/* Labels with scores */}
      {labelPositions.map((lp, i) => {
        const isHovered = hoveredIndex === i;
        const prevScore = previousScores?.[lp.key];
        const diff = prevScore !== undefined ? lp.score - prevScore : null;
        return (
          <g key={lp.key}>
            <text
              x={lp.x}
              y={lp.y - 6}
              textAnchor={lp.anchor}
              dominantBaseline="central"
              className={`text-[9px] font-semibold ${isHovered ? "fill-foreground" : "fill-muted-foreground"}`}
              style={{ transition: "fill 0.2s" }}
            >
              {labels[lp.key] || lp.key}
            </text>
            <text
              x={lp.x}
              y={lp.y + 7}
              textAnchor={lp.anchor}
              dominantBaseline="central"
              className="text-[10px] font-bold"
              fill={getScoreColor(lp.score)}
            >
              {lp.score}/{maxScore}
              {diff !== null && diff !== 0 && (
                <tspan fill={diff > 0 ? SCORE_COLORS.high : SCORE_COLORS.low} className="text-[8px]">
                  {" "}{diff > 0 ? "▲" : "▼"}{Math.abs(diff)}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoveredIndex !== null && (
        <g>
          <rect
            x={cx - 45}
            y={cy - 14}
            width={90}
            height={28}
            rx={6}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
          <text x={cx} y={cy + 2} textAnchor="middle" className="fill-foreground text-[10px] font-bold">
            {labels[entries[hoveredIndex][0]] || entries[hoveredIndex][0]}: {entries[hoveredIndex][1]}/{maxScore}
          </text>
        </g>
      )}
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

  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  }

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

  dataPoints.forEach(([x, y]) => {
    doc.circle(x, y, 1.2, "F");
  });

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