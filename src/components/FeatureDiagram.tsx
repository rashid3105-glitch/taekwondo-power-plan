import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" as any } };

/* ─── Plan: Mini periodization wave ─── */
function PlanDiagram() {
  const phases = [
    { label: "Adapt", vol: 60, int: 40, color: "hsl(var(--speed))" },
    { label: "Build", vol: 85, int: 60, color: "hsl(var(--energy))" },
    { label: "Peak", vol: 50, int: 90, color: "hsl(var(--explosive))" },
    { label: "Deload", vol: 30, int: 30, color: "hsl(var(--tab-mental))" },
  ];
  const W = 400, H = 120, PX = 24, PY = 16;
  const usableW = W - PX * 2, usableH = H - PY * 2;
  const pt = (vals: number[]) => vals.map((v, i) => ({ x: PX + (i / (vals.length - 1)) * usableW, y: PY + usableH - (v / 100) * usableH }));
  const curve = (pts: { x: number; y: number }[]) => {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cx1 = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4;
      const cx2 = pts[i + 1].x - (pts[i + 1].x - pts[i].x) * 0.4;
      d += ` C ${cx1} ${pts[i].y}, ${cx2} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  };
  const volPts = pt(phases.map(p => p.vol));
  const intPts = pt(phases.map(p => p.int));

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full max-w-[280px] sm:max-w-xs mx-auto">
      <defs>
        <linearGradient id="fd-vol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--energy))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--energy))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 50, 100].map(v => {
        const y = PY + usableH - (v / 100) * usableH;
        return <line key={v} x1={PX} y1={y} x2={W - PX} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 4" />;
      })}
      <motion.path d={`${curve(volPts)} L ${volPts[volPts.length - 1].x} ${H - PY} L ${volPts[0].x} ${H - PY} Z`} fill="url(#fd-vol)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
      <motion.path d={curve(volPts)} fill="none" stroke="hsl(var(--energy))" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeInOut" }} />
      <motion.path d={curve(intPts)} fill="none" stroke="hsl(var(--explosive))" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }} />
      {phases.map((p, i) => {
        const x = PX + (i / (phases.length - 1)) * usableW;
        return (
          <g key={p.label}>
            <motion.rect x={x - 22} y={H + 2} width="44" height="16" rx="4" fill={p.color} fillOpacity="0.12" stroke={p.color} strokeOpacity="0.3" strokeWidth="0.5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }} />
            <motion.text x={x} y={H + 13} textAnchor="middle" fontSize="7" fontWeight="700" fill={p.color} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }}>{p.label}</motion.text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Progress: Animated bar chart ─── */
function ProgressDiagram() {
  const bars = [
    { label: "W1", value: 45, color: "hsl(var(--energy))" },
    { label: "W2", value: 62, color: "hsl(var(--energy))" },
    { label: "W3", value: 78, color: "hsl(var(--energy))" },
    { label: "W4", value: 55, color: "hsl(var(--speed))" },
    { label: "W5", value: 85, color: "hsl(var(--energy))" },
    { label: "W6", value: 92, color: "hsl(var(--explosive))" },
  ];
  const W = 360, H = 120, PX = 20, PY = 12;
  const barW = 30, gap = (W - PX * 2 - bars.length * barW) / (bars.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <line x1={PX} y1={H - PY} x2={W - PX} y2={H - PY} stroke="hsl(var(--border))" strokeWidth="0.5" />
      {bars.map((b, i) => {
        const x = PX + i * (barW + gap);
        const barH = (b.value / 100) * (H - PY * 2);
        const y = H - PY - barH;
        return (
          <g key={b.label}>
            <defs>
              <linearGradient id={`bg-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={b.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.rect x={x} y={y} width={barW} height={barH} rx="4" fill={`url(#bg-${i})`} initial={{ scaleY: 0, originY: "100%" }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }} style={{ transformOrigin: `${x + barW / 2}px ${H - PY}px` }} />
            <motion.text x={x + barW / 2} y={H + 8} textAnchor="middle" fontSize="8" className="fill-muted-foreground" fontWeight="600" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.05 }}>{b.label}</motion.text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Mental: Animated radar ─── */
function MentalDiagram() {
  const dims = ["Focus", "Grit", "Calm", "Drive", "Vision"];
  const values = [0.8, 0.65, 0.7, 0.9, 0.75];
  const cx = 140, cy = 100, R = 70;
  const angleStep = (2 * Math.PI) / dims.length;
  const poly = (vals: number[]) => vals.map((v, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    return `${cx + Math.cos(a) * R * v},${cy + Math.sin(a) * R * v}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 280 210" className="w-full max-w-[200px] sm:max-w-[240px] mx-auto">
      {[0.33, 0.66, 1].map(s => (
        <polygon key={s} points={dims.map((_, i) => {
          const a = -Math.PI / 2 + i * angleStep;
          return `${cx + Math.cos(a) * R * s},${cy + Math.sin(a) * R * s}`;
        }).join(" ")} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
      ))}
      {dims.map((_, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="hsl(var(--border))" strokeWidth="0.5" />;
      })}
      <motion.polygon points={poly(values)} fill="hsl(var(--tab-mental))" fillOpacity="0.15" stroke="hsl(var(--tab-mental))" strokeWidth="2" initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {dims.map((d, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const lx = cx + Math.cos(a) * (R + 16);
        const ly = cy + Math.sin(a) * (R + 16);
        return <motion.text key={d} x={lx} y={ly + 3} textAnchor="middle" fontSize="8" fontWeight="600" className="fill-muted-foreground" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.08 }}>{d}</motion.text>;
      })}
      {values.map((v, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        return <motion.circle key={i} cx={cx + Math.cos(a) * R * v} cy={cy + Math.sin(a) * R * v} r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--tab-mental))" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.08 }} />;
      })}
    </svg>
  );
}

/* ─── Rehab: Phased recovery timeline ─── */
function RehabDiagram() {
  const phases = [
    { label: "Protect", pct: 20, color: "hsl(var(--tab-rehab))" },
    { label: "Restore", pct: 50, color: "hsl(var(--energy))" },
    { label: "Strengthen", pct: 80, color: "hsl(var(--speed))" },
    { label: "Return", pct: 100, color: "hsl(var(--explosive))" },
  ];
  const W = 380, H = 60;

  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} className="w-full max-w-sm mx-auto">
      <line x1="30" y1="25" x2={W - 30} y2="25" stroke="hsl(var(--border))" strokeWidth="2" strokeLinecap="round" />
      {phases.map((p, i) => {
        const x = 30 + (i / (phases.length - 1)) * (W - 60);
        return (
          <g key={p.label}>
            <motion.circle cx={x} cy={25} r="8" fill={p.color} fillOpacity="0.2" stroke={p.color} strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.15, type: "spring" }} />
            <motion.circle cx={x} cy={25} r="3" fill={p.color} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 + i * 0.15 }} />
            <motion.text x={x} y={48} textAnchor="middle" fontSize="8" fontWeight="700" fill={p.color} initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.12 }}>{p.label}</motion.text>
          </g>
        );
      })}
      {/* Animated progress line */}
      <motion.line x1="30" y1="25" x2={W - 30} y2="25" stroke="hsl(var(--tab-rehab))" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeInOut" }} />
    </svg>
  );
}

/* ─── Nutrition: Animated donut chart ─── */
function NutritionDiagram() {
  const macros = [
    { label: "Protein", pct: 30, color: "hsl(var(--explosive))" },
    { label: "Carbs", pct: 50, color: "hsl(var(--energy))" },
    { label: "Fat", pct: 20, color: "hsl(var(--speed))" },
  ];
  const cx = 100, cy = 90, R = 55, r = 32;

  let cumAngle = -90;
  const arcs = macros.map(m => {
    const start = cumAngle;
    const sweep = (m.pct / 100) * 360;
    cumAngle += sweep;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + R * Math.cos(toRad(start));
    const y1 = cy + R * Math.sin(toRad(start));
    const x2 = cx + R * Math.cos(toRad(start + sweep));
    const y2 = cy + R * Math.sin(toRad(start + sweep));
    const ix1 = cx + r * Math.cos(toRad(start + sweep));
    const iy1 = cy + r * Math.sin(toRad(start + sweep));
    const ix2 = cx + r * Math.cos(toRad(start));
    const iy2 = cy + r * Math.sin(toRad(start));
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;
    const midA = toRad(start + sweep / 2);
    const lx = cx + (R + 22) * Math.cos(midA);
    const ly = cy + (R + 22) * Math.sin(midA);
    return { ...m, d, lx, ly };
  });

  return (
    <svg viewBox="0 0 200 190" className="w-full max-w-[200px] mx-auto">
      {arcs.map((a, i) => (
        <g key={a.label}>
          <motion.path d={a.d} fill={a.color} fillOpacity="0.7" stroke="hsl(var(--background))" strokeWidth="1.5" initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
          <motion.text x={a.lx} y={a.ly + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill={a.color} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1 }}>{a.label}</motion.text>
        </g>
      ))}
      <motion.text x={cx} y={cy + 3} textAnchor="middle" fontSize="11" fontWeight="800" className="fill-foreground" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }}>2400</motion.text>
      <motion.text x={cx} y={cy + 14} textAnchor="middle" fontSize="7" className="fill-muted-foreground" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 }}>kcal</motion.text>
    </svg>
  );
}

/* ─── Testing: Animated metric gauges ─── */
function TestingDiagram() {
  const tests = [
    { label: "Sprint", value: 78, color: "hsl(var(--speed))" },
    { label: "Agility", value: 85, color: "hsl(var(--energy))" },
    { label: "Power", value: 70, color: "hsl(var(--explosive))" },
    { label: "Endurance", value: 65, color: "hsl(var(--tab-mental))" },
  ];
  const W = 360, barH = 10, gap = 28, PX = 60;

  return (
    <svg viewBox={`0 0 ${W} ${tests.length * gap + 10}`} className="w-full max-w-sm mx-auto">
      {tests.map((t, i) => {
        const y = 12 + i * gap;
        const barW = W - PX - 40;
        return (
          <g key={t.label}>
            <text x={PX - 8} y={y + barH / 2 + 3} textAnchor="end" fontSize="8" fontWeight="600" className="fill-muted-foreground">{t.label}</text>
            <rect x={PX} y={y} width={barW} height={barH} rx="5" fill="hsl(var(--secondary))" />
            <motion.rect x={PX} y={y} width={barW * (t.value / 100)} height={barH} rx="5" fill={t.color} initial={{ width: 0 }} whileInView={{ width: barW * (t.value / 100) }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }} />
            <motion.text x={PX + barW * (t.value / 100) + 6} y={y + barH / 2 + 3} fontSize="8" fontWeight="700" fill={t.color} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1 }}>{t.value}%</motion.text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Library: Animated category grid ─── */
function LibraryDiagram() {
  const cats = [
    { label: "Strength", icon: "◆", color: "hsl(var(--explosive))" },
    { label: "Speed", icon: "⚡", color: "hsl(var(--speed))" },
    { label: "Core", icon: "●", color: "hsl(var(--energy))" },
    { label: "Mobility", icon: "◎", color: "hsl(var(--tab-mental))" },
    { label: "Power", icon: "▲", color: "hsl(var(--tab-rehab))" },
    { label: "Balance", icon: "◇", color: "hsl(var(--tab-nutrition))" },
  ];
  const cols = 3, cellW = 90, cellH = 50, gap = 8, PX = 20;

  return (
    <svg viewBox={`0 0 ${PX * 2 + cols * cellW + (cols - 1) * gap} ${PX + 2 * cellH + gap + 10}`} className="w-full max-w-xs mx-auto">
      {cats.map((c, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = PX + col * (cellW + gap);
        const y = 8 + row * (cellH + gap);
        return (
          <motion.g key={c.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
            <rect x={x} y={y} width={cellW} height={cellH} rx="8" fill={c.color} fillOpacity="0.08" stroke={c.color} strokeOpacity="0.25" strokeWidth="1" />
            <text x={x + cellW / 2} y={y + 22} textAnchor="middle" fontSize="14">{c.icon}</text>
            <text x={x + cellW / 2} y={y + 38} textAnchor="middle" fontSize="8" fontWeight="700" fill={c.color}>{c.label}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ─── Main export ─── */
const diagrams: Record<string, React.FC> = {
  plan: PlanDiagram,
  progress: ProgressDiagram,
  mental: MentalDiagram,
  rehab: RehabDiagram,
  nutrition: NutritionDiagram,
  testing: TestingDiagram,
  library: LibraryDiagram,
};

export function FeatureDiagram({ feature }: { feature: string }) {
  const Diagram = diagrams[feature];
  if (!Diagram) return null;

  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-6 sm:p-8 shadow-card"
    >
      <Diagram />
    </motion.div>
  );
}
