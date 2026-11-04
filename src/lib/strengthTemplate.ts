/**
 * 6-day High/Low strength & athleticism template for taekwondo athletes.
 * Based on the coach-supplied baseline week. Produces training_plans.plan_data
 * (weeklySchedule + periodization) for a 4–6 week block.
 */
export type Locale = "en" | "da" | "sv" | "de" | "ar" | "no" | "es";
export type TemplateWeeks = 4 | 5 | 6;

type Ex = { name: string; sets: number; reps: string; category: string; load?: string };

const L = (o: Record<Locale, string>) => o;

const TXT = {
  planName: L({ en: "TKD Strength & Athleticism (High/Low)", da: "TKD Styrke & Atletik (High/Low)", sv: "TKD Styrka & Atletik (High/Low)", de: "TKD Kraft & Athletik (High/Low)", ar: "قوة ولياقة التايكوندو (عالي/منخفض)", no: "TKD Styrke & Atletikk (High/Low)", es: "TKD Fuerza y Atletismo (High/Low)" }),
  high: L({ en: "HIGH", da: "HIGH", sv: "HIGH", de: "HIGH", ar: "عالي", no: "HIGH", es: "ALTO" }),
  low: L({ en: "LOW", da: "LOW", sv: "LOW", de: "LOW", ar: "منخفض", no: "LOW", es: "BAJO" }),
  d1: L({ en: "Plyometrics & lower body / push-pull", da: "Plyometri & underkrop / pres-træk", sv: "Plyometri & underkropp / press-drag", de: "Plyometrie & Unterkörper / Drücken-Ziehen", ar: "بليومترك والجزء السفلي / دفع وسحب", no: "Plyometri & underkropp / press-trekk", es: "Pliometría y tren inferior / empuje-tirón" }),
  d2: L({ en: "Active recovery & knee/groin isometrics — optional rest day", da: "Aktiv restitution & knæ/lyske-isometri — valgfri hviledag", sv: "Aktiv återhämtning & knä/ljumske-isometri — valfri vilodag", de: "Aktive Erholung & Knie/Leiste isometrisch — optionaler Ruhetag", ar: "استشفاء نشط وتمارين ثابتة للركبة والفخذ — يوم راحة اختياري", no: "Aktiv restitusjon & kne/lyske-isometri — valgfri hviledag", es: "Recuperación activa e isometría rodilla/ingle — descanso opcional" }),
  d3: L({ en: "Explosiveness, hinge & upper body press", da: "Eksplosivitet, hoftebøjning & overkropspres", sv: "Explosivitet, höftfällning & överkroppspress", de: "Explosivität, Hüftbeugen & Oberkörperdrücken", ar: "انفجارية، ثني الورك ودفع الجزء العلوي", no: "Eksplosivitet, hoftebøy & overkroppspress", es: "Explosividad, bisagra de cadera y empuje superior" }),
  d4: L({ en: "Hip prehab & core stability — optional rest day", da: "Hoftepræhab & core-stabilitet — valgfri hviledag", sv: "Höftprehab & bålstabilitet — valfri vilodag", de: "Hüft-Prähab & Rumpfstabilität — optionaler Ruhetag", ar: "وقاية الورك وثبات الجذع — يوم راحة اختياري", no: "Hofteprehab & kjernestabilitet — valgfri hviledag", es: "Prehab de cadera y estabilidad del core — descanso opcional" }),
  d5: L({ en: "Sprint, sled & posterior chain", da: "Sprint, slæde & bagkæde", sv: "Sprint, släde & baksida", de: "Sprint, Schlitten & hintere Kette", ar: "سرعة، زلاجة والسلسلة الخلفية", no: "Sprint, slede & bakside", es: "Sprint, trineo y cadena posterior" }),
  d6: L({ en: "Upper body & athlete's choice — build the session around your focus areas", da: "Overkrop & frit valg — byg passet om dine fokusområder", sv: "Överkropp & fritt val — bygg passet kring dina fokusområden", de: "Oberkörper & freie Wahl — baue die Einheit um deine Schwerpunkte", ar: "الجزء العلوي واختيار حر — ابنِ الحصة حول أولوياتك", no: "Overkropp & fritt valg — bygg økta rundt fokusområdene dine", es: "Tren superior y elección libre — arma la sesión según tu enfoque" }),
  tkdHard: L({ en: "Taekwondo — hard sparring / match tempo", da: "Taekwondo — hård sparring / kamptempo", sv: "Taekwondo — hård sparring / matchtempo", de: "Taekwondo — hartes Sparring / Kampftempo", ar: "تايكوندو — نزال قوي / إيقاع مباراة", no: "Taekwondo — hard sparring / kamptempo", es: "Taekwondo — sparring duro / ritmo de combate" }),
  tkdTactic: L({ en: "Taekwondo — tactics & kicking combinations", da: "Taekwondo — taktik & sparkekombinationer", sv: "Taekwondo — taktik & sparkkombinationer", de: "Taekwondo — Taktik & Trittkombinationen", ar: "تايكوندو — تكتيك وتركيبات الركلات", no: "Taekwondo — taktikk & sparkekombinasjoner", es: "Taekwondo — táctica y combinaciones de patadas" }),
  tkdSim: L({ en: "Taekwondo — match simulation / high-intensity intervals", da: "Taekwondo — kampsimulering / højintensive intervaller", sv: "Taekwondo — matchsimulering / högintensiva intervaller", de: "Taekwondo — Kampfsimulation / hochintensive Intervalle", ar: "تايكوندو — محاكاة مباراة / فترات عالية الشدة", no: "Taekwondo — kampsimulering / høyintensive intervaller", es: "Taekwondo — simulación de combate / intervalos intensos" }),
  tkdLight: L({ en: "Taekwondo — light technique / poomsae or off the mat", da: "Taekwondo — let teknik / poomsae eller fri fra måtten", sv: "Taekwondo — lätt teknik / poomsae eller ledigt", de: "Taekwondo — leichte Technik / Poomsae oder mattenfrei", ar: "تايكوندو — تقنية خفيفة / بومسي أو راحة", no: "Taekwondo — lett teknikk / poomsae eller fri", es: "Taekwondo — técnica ligera / poomsae o libre" }),
  restLabel: L({ en: "Full recovery", da: "Fuld restitution", sv: "Full återhämtning", de: "Volle Erholung", ar: "استشفاء كامل", no: "Full restitusjon", es: "Recuperación completa" }),
  restFocus: L({ en: "No strength or mat training — sleep, hydration, mental rest", da: "Ingen styrke- eller måttetræning — søvn, væske, mental ro", sv: "Ingen styrke- eller mattträning — sömn, vätska, mental vila", de: "Kein Kraft- oder Mattentraining — Schlaf, Flüssigkeit, mentale Ruhe", ar: "لا تدريب قوة أو بساط — نوم، ترطيب، راحة ذهنية", no: "Ingen styrke- eller mattetrening — søvn, væske, mental ro", es: "Sin fuerza ni tatami — sueño, hidratación, descanso mental" }),
};

const PHASES: Record<string, { name: Record<Locale, string>; note: Record<Locale, string>; vol: number; int: number }> = {
  base: { vol: 70, int: 70, name: L({ en: "Baseline", da: "Baseline", sv: "Baslinje", de: "Basiswoche", ar: "الأساس", no: "Baseline", es: "Base" }), note: L({ en: "Establish loads and RPE anchors on all main lifts (@6–7 RPE).", da: "Fastlæg belastninger og RPE-ankre på alle hovedløft (@6–7 RPE).", sv: "Fastställ belastningar och RPE-ankare på alla huvudlyft (@6–7 RPE).", de: "Lasten und RPE-Anker für alle Hauptübungen festlegen (@6–7 RPE).", ar: "حدد الأحمال ومراسي RPE لجميع الرفعات الرئيسية (@6–7).", no: "Fastsett belastning og RPE-ankre på alle hovedløft (@6–7 RPE).", es: "Fija cargas y anclas de RPE en los levantamientos principales (@6–7)." }) },
  volume: { vol: 85, int: 75, name: L({ en: "Volume", da: "Volumen", sv: "Volym", de: "Volumen", ar: "الحجم", no: "Volum", es: "Volumen" }), note: L({ en: "+1 set on main lifts, RPE 7–8.", da: "+1 sæt på hovedløft, RPE 7–8.", sv: "+1 set på huvudlyft, RPE 7–8.", de: "+1 Satz bei Hauptübungen, RPE 7–8.", ar: "+1 مجموعة في الرفعات الرئيسية، RPE 7–8.", no: "+1 sett på hovedløft, RPE 7–8.", es: "+1 serie en los principales, RPE 7–8." }) },
  intensity: { vol: 85, int: 85, name: L({ en: "Intensity", da: "Intensitet", sv: "Intensitet", de: "Intensität", ar: "الشدة", no: "Intensitet", es: "Intensidad" }), note: L({ en: "Same sets, heavier loads (@8 RPE) — highest weekly load.", da: "Samme sæt, tungere vægt (@8 RPE) — højeste ugebelastning.", sv: "Samma set, tyngre vikt (@8 RPE) — högsta veckobelastning.", de: "Gleiche Sätze, schwerer (@8 RPE) — höchste Wochenlast.", ar: "نفس المجموعات بأوزان أثقل (@8) — أعلى حمل أسبوعي.", no: "Samme sett, tyngre vekt (@8 RPE) — høyeste ukebelastning.", es: "Mismas series, más carga (@8) — mayor carga semanal." }) },
  power: { vol: 70, int: 85, name: L({ en: "Conversion / speed-strength", da: "Konvertering / hastighedsstyrke", sv: "Konvertering / snabbstyrka", de: "Umwandlung / Schnellkraft", ar: "التحويل / القوة السريعة", no: "Konvertering / hurtighetsstyrke", es: "Conversión / fuerza-velocidad" }), note: L({ en: "Fewer reps, max bar speed; more reactive jumps.", da: "Færre gentagelser, maksimal fart i løftene; mere reaktive spring.", sv: "Färre reps, maximal fart; mer reaktiva hopp.", de: "Weniger Wdh., maximale Geschwindigkeit; reaktivere Sprünge.", ar: "تكرارات أقل وسرعة قصوى؛ قفزات أكثر تفاعلية.", no: "Færre reps, maks fart; mer reaktive hopp.", es: "Menos reps, máxima velocidad; saltos más reactivos." }) },
  peak: { vol: 60, int: 90, name: L({ en: "Competition peak", da: "Stævnespidsbelastning", sv: "Tävlingstopp", de: "Wettkampfspitze", ar: "ذروة المنافسة", no: "Konkurransetopp", es: "Pico competitivo" }), note: L({ en: "Fight-specific sprints, reactive plyometrics, prehab.", da: "Kamprelevante sprints, reaktiv plyometri og præhab.", sv: "Matchspecifika sprinter, reaktiv plyometri, prehab.", de: "Kampfspezifische Sprints, reaktive Plyometrie, Prähab.", ar: "سرعات خاصة بالنزال، بليومترك تفاعلي، وقاية.", no: "Kampspesifikke sprinter, reaktiv plyometri, prehab.", es: "Sprints de combate, pliometría reactiva, prehab." }) },
  deload: { vol: 50, int: 60, name: L({ en: "Deload / taper", da: "Deload / aftrapning", sv: "Deload / nedtrappning", de: "Deload / Tapering", ar: "تخفيف / تهدئة", no: "Deload / nedtrapping", es: "Descarga / tapering" }), note: L({ en: "Half the volume (@5–6 RPE) so the legs are fresh for competition.", da: "Halveret volumen (@5–6 RPE), så benene er friske til stævne.", sv: "Halverad volym (@5–6 RPE) så benen är fräscha till tävling.", de: "Halbes Volumen (@5–6 RPE) für frische Beine zum Wettkampf.", ar: "نصف الحجم (@5–6) لتكون الأرجل منتعشة للمنافسة.", no: "Halvert volum (@5–6 RPE) så beina er friske til stevne.", es: "Mitad de volumen (@5–6) para llegar fresco a competir." }) },
};

export const WEEK_PHASES: Record<TemplateWeeks, string[]> = {
  4: ["base", "volume", "intensity", "deload"],
  5: ["base", "volume", "intensity", "power", "deload"],
  6: ["base", "volume", "intensity", "power", "peak", "deload"],
};

const D1: Ex[] = [
  { name: "Low Pogo Jumps", sets: 2, reps: "10", category: "plyometric" },
  { name: "Depth Drops", sets: 3, reps: "4", category: "plyometric" },
  { name: "DB Jump Squat", sets: 3, reps: "4", category: "power", load: "light DB (~5 kg)" },
  { name: "Back Squat", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Bulgarian Split Squat", sets: 3, reps: "8", category: "strength", load: "@6 RPE" },
  { name: "Single Arm Landmine Row", sets: 3, reps: "10", category: "strength", load: "@7 RPE" },
  { name: "Standing Landmine Press", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Pull-Up", sets: 3, reps: "6-10", category: "strength", load: "@7 RPE" },
  { name: "Calf Raise", sets: 3, reps: "15-20", category: "strength", load: "@6 RPE" },
];
const D2: Ex[] = [
  { name: "Active Recovery", sets: 1, reps: "10-20 min", category: "mobility" },
  { name: "Lunge Iso Hold (heels elevated)", sets: 3, reps: "45 s", category: "prehab" },
  { name: "Knee Extension Isometric 45°", sets: 3, reps: "45 s", category: "prehab" },
  { name: "Copenhagen Plank", sets: 3, reps: "10", category: "prehab" },
  { name: "Core (Choice)", sets: 2, reps: "—", category: "core" },
];
const D3: Ex[] = [
  { name: "Low Skips", sets: 2, reps: "10 m", category: "plyometric" },
  { name: "Power Skip", sets: 2, reps: "10 m", category: "plyometric" },
  { name: "Seated Box Jump", sets: 4, reps: "4", category: "plyometric" },
  { name: "Trap Bar Deadlift", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Hip Thrust", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "DB Push Press", sets: 3, reps: "5", category: "power", load: "@7 RPE" },
  { name: "Incline DB Bench Press", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Dips", sets: 3, reps: "10-20", category: "strength" },
  { name: "DB Lateral Raise", sets: 3, reps: "10-15", category: "strength" },
];
const D4: Ex[] = [
  { name: "Active Recovery", sets: 1, reps: "10-20 min", category: "mobility" },
  { name: "Hip Flexor Sit Up", sets: 3, reps: "10", category: "core" },
  { name: "Side Plank Hip Abduction", sets: 3, reps: "10", category: "prehab" },
  { name: "Single Leg Bridge Isometric", sets: 2, reps: "4 × 20 s", category: "prehab" },
  { name: "Core (Choice)", sets: 2, reps: "—", category: "core" },
];
const D5: Ex[] = [
  { name: "Low Pogo Jumps", sets: 2, reps: "10 m", category: "plyometric" },
  { name: "Tuck Jumps (Continuous)", sets: 2, reps: "10 m", category: "plyometric" },
  { name: "Progressive Build Ups (Sprint)", sets: 3, reps: "20 m", category: "speed", load: "@70/80/90%" },
  { name: "Fly Sprint", sets: 3, reps: "20 m", category: "speed", load: "@90%" },
  { name: "Sled Push", sets: 4, reps: "20 m", category: "power" },
  { name: "Romanian Deadlift (RDL)", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Leg Extension", sets: 2, reps: "12-15", category: "strength", load: "@7 RPE" },
  { name: "Prone Machine Hamstring Curl", sets: 2, reps: "12-15", category: "strength", load: "@7 RPE" },
  { name: "Seated Calf Raise", sets: 2, reps: "15-20", category: "strength", load: "@7 RPE" },
];
const D6: Ex[] = [
  { name: "Barbell Bench Press", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "DB Shoulder Press", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Row (Choice)", sets: 3, reps: "8", category: "strength", load: "@7 RPE" },
  { name: "Triceps (Choice)", sets: 1, reps: "—", category: "strength" },
  { name: "Biceps (Choice)", sets: 1, reps: "—", category: "strength" },
  { name: "Shoulder (Choice)", sets: 3, reps: "10", category: "strength", load: "@7 RPE" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const toExercise = (e: Ex) => ({
  name: e.name, sets: e.sets, reps: e.reps, rest: e.category === "strength" ? "2 min" : "60-90 s",
  category: e.category, tempo: e.load ?? null,
});

/** Build training_plans.plan_data for a 4–6 week High/Low block. */
export function buildStrengthTemplatePlan(weeks: TemplateWeeks, locale: Locale) {
  const tr = (o: Record<Locale, string>) => o[locale] ?? o.en;
  const gym = (tag: "high" | "low", focus: string, list: Ex[]) => ({
    type: "gym", label: `${tr(TXT[tag])} · ${focus}`, focus, exercises: list.map(toExercise),
  });
  const tkd = (focus: string) => ({ type: "tkd", label: focus, focus, exercises: [] });
  const plan = [
    [gym("high", tr(TXT.d1), D1), tkd(tr(TXT.tkdHard))],
    [gym("low", tr(TXT.d2), D2), tkd(tr(TXT.tkdLight))],
    [gym("high", tr(TXT.d3), D3), tkd(tr(TXT.tkdTactic))],
    [gym("low", tr(TXT.d4), D4), tkd(tr(TXT.tkdLight))],
    [gym("high", tr(TXT.d5), D5), tkd(tr(TXT.tkdSim))],
    [gym("low", tr(TXT.d6), D6), tkd(tr(TXT.tkdLight))],
    [{ type: "rest", label: tr(TXT.restLabel), focus: tr(TXT.restFocus), exercises: [] }],
  ];
  const weeklySchedule = plan.map((sessions, i) => ({
    dayOfWeek: DAYS[i], type: sessions[0].type, label: sessions[0].label, sessions,
  }));
  const periodization = WEEK_PHASES[weeks].map((key, i) => {
    const p = PHASES[key];
    return {
      phase: tr(p.name), weeks: String(i + 1), startWeek: i + 1, endWeek: i + 1,
      focus: tr(p.note), keyChanges: tr(p.note), volumePercent: p.vol, intensityPercent: p.int,
    };
  });
  return { planName: `${tr(TXT.planName)} · ${weeks}`, template: "tkd_high_low_v1", weeks, weeklySchedule, periodization };
}
