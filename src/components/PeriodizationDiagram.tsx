import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const phases = [
  { key: "adaptation", weeks: "1–2", volume: 60, intensity: 45, color: "hsl(var(--speed))" },
  { key: "accumulation", weeks: "3–5", volume: 85, intensity: 60, color: "hsl(var(--energy))" },
  { key: "intensification", weeks: "6–7", volume: 65, intensity: 85, color: "hsl(var(--power))" },
  { key: "peaking", weeks: "8", volume: 40, intensity: 95, color: "hsl(var(--explosive))" },
  { key: "deload", weeks: "→", volume: 30, intensity: 30, color: "hsl(var(--tab-mental))" },
];

const labels: Record<string, Record<string, string>> = {
  en: {
    title: "Periodization Cycle",
    volume: "Volume",
    intensity: "Intensity",
    adaptation: "Adaptation",
    accumulation: "Accumulation",
    intensification: "Intensification",
    peaking: "Peaking",
    deload: "Deload",
    weeks: "Wk",
  },
  da: {
    title: "Periodiseringscyklus",
    volume: "Volumen",
    intensity: "Intensitet",
    adaptation: "Tilpasning",
    accumulation: "Akkumulering",
    intensification: "Intensivering",
    peaking: "Peaking",
    deload: "Deload",
    weeks: "Uge",
  },
  sv: {
    title: "Periodiseringscykel",
    volume: "Volym",
    intensity: "Intensitet",
    adaptation: "Anpassning",
    accumulation: "Ackumulering",
    intensification: "Intensifiering",
    peaking: "Peaking",
    deload: "Deload",
    weeks: "V",
  },
};

// SVG wave path builder for smooth curves through data points
function buildCurvePath(values: number[], width: number, height: number, padX: number, padY: number): string {
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const points = values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * usableW,
    y: padY + usableH - (v / 100) * usableH,
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.4;
    const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) * 0.4;
    d += ` C ${cp1x} ${points[i].y}, ${cp2x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return d;
}

function buildAreaPath(values: number[], width: number, height: number, padX: number, padY: number): string {
  const curve = buildCurvePath(values, width, height, padX, padY);
  const usableW = width - padX * 2;
  return `${curve} L ${padX + usableW} ${height - padY} L ${padX} ${height - padY} Z`;
}

export function PeriodizationDiagram() {
  const { locale } = useLanguage();
  const l = labels[locale] || labels.en;

  const W = 560;
  const H = 220;
  const PX = 40;
  const PY = 28;

  const volumeValues = phases.map((p) => p.volume);
  const intensityValues = phases.map((p) => p.intensity);

  const volumeCurve = buildCurvePath(volumeValues, W, H, PX, PY);
  const intensityCurve = buildCurvePath(intensityValues, W, H, PX, PY);
  const volumeArea = buildAreaPath(volumeValues, W, H, PX, PY);
  const intensityArea = buildAreaPath(intensityValues, W, H, PX, PY);

  const usableW = W - PX * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-5 sm:p-7 shadow-card overflow-hidden"
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
        {l.title}
      </h3>

      {/* Chart */}
      <div className="w-full overflow-x-auto -mx-1">
        <svg
          viewBox={`0 0 ${W} ${H + 48}`}
          className="w-full min-w-[420px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--energy))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--energy))" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--explosive))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--explosive))" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => {
            const y = PY + (H - PY * 2) - (v / 100) * (H - PY * 2);
            return (
              <g key={v}>
                <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 4" />
                <text x={PX - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                  {v}%
                </text>
              </g>
            );
          })}

          {/* Phase zone separators + labels */}
          {phases.map((phase, i) => {
            const x = PX + (i / (phases.length - 1)) * usableW;
            return (
              <g key={phase.key}>
                <line x1={x} y1={PY} x2={x} y2={H - PY} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.4" />
              </g>
            );
          })}

          {/* Area fills */}
          <motion.path
            d={volumeArea}
            fill="url(#volGrad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <motion.path
            d={intensityArea}
            fill="url(#intGrad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Volume curve */}
          <motion.path
            d={volumeCurve}
            fill="none"
            stroke="hsl(var(--energy))"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          />

          {/* Intensity curve */}
          <motion.path
            d={intensityCurve}
            fill="none"
            stroke="hsl(var(--explosive))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
          />

          {/* Data points – Volume */}
          {volumeValues.map((v, i) => {
            const x = PX + (i / (phases.length - 1)) * usableW;
            const y = PY + (H - PY * 2) - (v / 100) * (H - PY * 2);
            return (
              <motion.circle
                key={`v-${i}`}
                cx={x}
                cy={y}
                r="4"
                fill="hsl(var(--background))"
                stroke="hsl(var(--energy))"
                strokeWidth="2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              />
            );
          })}

          {/* Data points – Intensity */}
          {intensityValues.map((v, i) => {
            const x = PX + (i / (phases.length - 1)) * usableW;
            const y = PY + (H - PY * 2) - (v / 100) * (H - PY * 2);
            return (
              <motion.circle
                key={`i-${i}`}
                cx={x}
                cy={y}
                r="4"
                fill="hsl(var(--background))"
                stroke="hsl(var(--explosive))"
                strokeWidth="2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
              />
            );
          })}

          {/* Phase labels at bottom */}
          {phases.map((phase, i) => {
            const x = PX + (i / (phases.length - 1)) * usableW;
            return (
              <g key={`label-${phase.key}`}>
                <motion.rect
                  x={x - 30}
                  y={H + 2}
                  width="60"
                  height="18"
                  rx="4"
                  fill={phase.color}
                  fillOpacity="0.12"
                  stroke={phase.color}
                  strokeOpacity="0.3"
                  strokeWidth="0.5"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                />
                <motion.text
                  x={x}
                  y={H + 14}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="700"
                  letterSpacing="0.03em"
                  fill={phase.color}
                  className="uppercase"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                >
                  {l[phase.key]}
                </motion.text>
                <motion.text
                  x={x}
                  y={H + 32}
                  textAnchor="middle"
                  fontSize="7"
                  className="fill-muted-foreground"
                  fontFamily="'JetBrains Mono', monospace"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                >
                  {l.weeks} {phase.weeks}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded-full bg-energy" />
          <span className="text-[10px] font-semibold text-muted-foreground">{l.volume}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded-full bg-explosive" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--explosive)) 0 4px, transparent 4px 6px)" }} />
          <span className="text-[10px] font-semibold text-muted-foreground">{l.intensity}</span>
        </div>
      </div>
    </motion.div>
  );
}
