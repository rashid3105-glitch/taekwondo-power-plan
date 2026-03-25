import { motion } from "framer-motion";

const draw = { hidden: { pathLength: 0, opacity: 0 }, visible: (i: number) => ({ pathLength: 1, opacity: 1, transition: { pathLength: { delay: 0.2 + i * 0.15, duration: 0.8, ease: "easeInOut" }, opacity: { delay: 0.2 + i * 0.1, duration: 0.3 } } }) };
const pop = (i: number) => ({ hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { delay: 0.4 + i * 0.1, duration: 0.35, type: "spring", stiffness: 260, damping: 20 } } });

function PlanDiagram() {
  const bars = [28, 42, 35, 55, 48, 60, 52];
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      {bars.map((h, i) => (
        <motion.rect key={i} x={4 + i * 11} y={36 - (h / 100) * 32} width="7" rx="1.5" height={(h / 100) * 32}
          fill="hsl(var(--tab-plan))" fillOpacity={0.5 + i * 0.07}
          variants={pop(i)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      ))}
    </svg>
  );
}

function ProgressDiagram() {
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      <motion.path d="M 4 30 Q 15 28, 22 22 T 40 16 T 58 10 T 76 5"
        fill="none" stroke="hsl(var(--tab-progress))" strokeWidth="2" strokeLinecap="round"
        variants={draw} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      <motion.path d="M 4 30 Q 15 28, 22 22 T 40 16 T 58 10 T 76 5 L 76 36 L 4 36 Z"
        fill="hsl(var(--tab-progress))" fillOpacity="0.1"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.5 }} />
      {[{ x: 22, y: 22 }, { x: 40, y: 16 }, { x: 58, y: 10 }, { x: 76, y: 5 }].map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--background))" stroke="hsl(var(--tab-progress))" strokeWidth="1.5"
          variants={pop(i + 1)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      ))}
    </svg>
  );
}

function MentalDiagram() {
  const angles = [0, 72, 144, 216, 288];
  const values = [0.8, 0.6, 0.9, 0.5, 0.75];
  const cx = 40, cy = 18, r = 14;
  const pts = values.map((v, i) => {
    const a = (angles[i] - 90) * Math.PI / 180;
    return { x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      {[0.33, 0.66, 1].map((s, i) => (
        <motion.polygon key={i}
          points={angles.map(a => { const rad = (a - 90) * Math.PI / 180; return `${cx + Math.cos(rad) * r * s},${cy + Math.sin(rad) * r * s}`; }).join(" ")}
          fill="none" stroke="hsl(var(--tab-mental))" strokeWidth="0.4" strokeOpacity={0.3}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }} />
      ))}
      <motion.path d={path} fill="hsl(var(--tab-mental))" fillOpacity="0.2" stroke="hsl(var(--tab-mental))" strokeWidth="1.2"
        variants={draw} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="2" fill="hsl(var(--tab-mental))"
          variants={pop(i)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      ))}
    </svg>
  );
}

function RehabDiagram() {
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      <motion.path d="M 4 18 L 14 18 L 18 6 L 24 30 L 30 10 L 36 26 L 40 18 L 50 18"
        fill="none" stroke="hsl(var(--tab-rehab))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        variants={draw} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      <motion.path d="M 50 18 L 76 18"
        fill="none" stroke="hsl(var(--tab-rehab))" strokeWidth="1.8" strokeLinecap="round" strokeOpacity={0.4}
        variants={draw} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      <motion.circle cx="64" cy="14" r="5" fill="none" stroke="hsl(var(--tab-rehab))" strokeWidth="1.2" strokeOpacity={0.5}
        variants={pop(3)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      <motion.path d="M 64 11 L 64 17 M 61 14 L 67 14" stroke="hsl(var(--tab-rehab))" strokeWidth="1.2" strokeLinecap="round"
        variants={draw} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} />
    </svg>
  );
}

function NutritionDiagram() {
  const segments = [
    { pct: 0.4, color: "hsl(25, 90%, 55%)" },
    { pct: 0.35, color: "hsl(45, 90%, 55%)" },
    { pct: 0.25, color: "hsl(142, 70%, 45%)" },
  ];
  const cx = 40, cy = 18, r = 13;
  let cumulative = 0;
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      {segments.map((seg, i) => {
        const startAngle = cumulative * 360 - 90;
        cumulative += seg.pct;
        const endAngle = cumulative * 360 - 90;
        const startRad = startAngle * Math.PI / 180;
        const endRad = endAngle * Math.PI / 180;
        const largeArc = seg.pct > 0.5 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${cx + Math.cos(startRad) * r} ${cy + Math.sin(startRad) * r} A ${r} ${r} 0 ${largeArc} 1 ${cx + Math.cos(endRad) * r} ${cy + Math.sin(endRad) * r} Z`;
        return (
          <motion.path key={i} d={d} fill={seg.color} fillOpacity={0.55}
            initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15, duration: 0.4, type: "spring" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }} />
        );
      })}
      <motion.circle cx={cx} cy={cy} r="5" fill="hsl(var(--background))"
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7, type: "spring" }} />
    </svg>
  );
}

function TestingDiagram() {
  const data = [18, 24, 20, 30, 26, 34, 32];
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      {data.map((v, i) => (
        <motion.rect key={i} x={4 + i * 11} y={36 - v} width="7" height={v} rx="1"
          fill="hsl(190, 85%, 50%)" fillOpacity={0.35 + i * 0.08}
          variants={pop(i)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      ))}
      <motion.path d={`M 7.5 ${36 - data[0]} ${data.slice(1).map((v, i) => `L ${7.5 + (i + 1) * 11} ${36 - v}`).join(" ")}`}
        fill="none" stroke="hsl(190, 85%, 50%)" strokeWidth="1.5" strokeLinecap="round"
        variants={draw} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} />
    </svg>
  );
}

function LibraryDiagram() {
  return (
    <svg viewBox="0 0 80 36" className="w-full h-full">
      {[0, 1, 2].map(i => (
        <motion.g key={i} variants={pop(i)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <rect x={10 + i * 22} y={6 + i * 2} width="18" height="24" rx="2"
            fill="hsl(var(--tab-nutrition))" fillOpacity={0.15 + i * 0.12}
            stroke="hsl(var(--tab-nutrition))" strokeWidth="0.8" strokeOpacity={0.4} />
          {[0, 1, 2].map(j => (
            <rect key={j} x={13 + i * 22} y={11 + i * 2 + j * 5} width={10 + (j % 2) * 4} height="2" rx="1"
              fill="hsl(var(--tab-nutrition))" fillOpacity={0.3} />
          ))}
        </motion.g>
      ))}
    </svg>
  );
}

const diagrams: Record<string, () => JSX.Element> = {
  plan: PlanDiagram,
  progress: ProgressDiagram,
  mental: MentalDiagram,
  rehab: RehabDiagram,
  nutrition: NutritionDiagram,
  testing: TestingDiagram,
  library: LibraryDiagram,
};

export function SectionMiniDiagram({ slug }: { slug: string }) {
  const Diagram = diagrams[slug];
  if (!Diagram) return null;
  return (
    <div className="w-full h-10 mt-2 opacity-80">
      <Diagram />
    </div>
  );
}
