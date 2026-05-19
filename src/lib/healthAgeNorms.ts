// Age-adjusted reference ranges for everyday health metrics.
// Sources: NSF sleep guidelines, AHA resting HR (general population by age),
// HRV (RMSSD) population data (Nunan et al., Shaffer & Ginsberg).
// These are *general population* norms — trained athletes typically have
// lower RHR and higher HRV than these bands; the report uses both.

export interface AgeNorms {
  ageLabel: string;
  steps: { target: number; bandLow: number; bandHigh: number };
  sleep: { target: number; bandLow: number; bandHigh: number }; // hours
  rhr: { target: number; bandLow: number; bandHigh: number };   // bpm
  hrv: { target: number; bandLow: number; bandHigh: number };   // ms (RMSSD)
}

export function getAgeNorms(age: number | null | undefined): AgeNorms {
  const a = age && Number.isFinite(age) ? Number(age) : 25;

  // Sleep (hours) — NSF
  let sleep = { target: 8, bandLow: 7, bandHigh: 9 };
  if (a < 13) sleep = { target: 10, bandLow: 9, bandHigh: 11 };
  else if (a < 18) sleep = { target: 9, bandLow: 8, bandHigh: 10 };
  else if (a < 26) sleep = { target: 8, bandLow: 7, bandHigh: 9 };
  else if (a < 65) sleep = { target: 7.5, bandLow: 7, bandHigh: 9 };
  else sleep = { target: 7.5, bandLow: 7, bandHigh: 8 };

  // Steps — generally 10k for ages 18+, lower for younger / older
  let steps = { target: 10000, bandLow: 7000, bandHigh: 12000 };
  if (a < 13) steps = { target: 12000, bandLow: 9000, bandHigh: 15000 };
  else if (a < 18) steps = { target: 11000, bandLow: 8000, bandHigh: 14000 };
  else if (a >= 65) steps = { target: 7000, bandLow: 5000, bandHigh: 9000 };

  // Resting HR (general population, bpm)
  let rhr = { target: 65, bandLow: 60, bandHigh: 75 };
  if (a < 13) rhr = { target: 80, bandLow: 70, bandHigh: 95 };
  else if (a < 18) rhr = { target: 72, bandLow: 60, bandHigh: 85 };
  else if (a < 30) rhr = { target: 65, bandLow: 57, bandHigh: 75 };
  else if (a < 45) rhr = { target: 67, bandLow: 60, bandHigh: 75 };
  else if (a < 60) rhr = { target: 70, bandLow: 62, bandHigh: 78 };
  else rhr = { target: 70, bandLow: 60, bandHigh: 78 };

  // HRV RMSSD (ms) — general population, declines with age
  let hrv = { target: 50, bandLow: 35, bandHigh: 80 };
  if (a < 18) hrv = { target: 70, bandLow: 50, bandHigh: 100 };
  else if (a < 30) hrv = { target: 60, bandLow: 40, bandHigh: 90 };
  else if (a < 45) hrv = { target: 45, bandLow: 30, bandHigh: 70 };
  else if (a < 60) hrv = { target: 35, bandLow: 25, bandHigh: 55 };
  else hrv = { target: 28, bandLow: 20, bandHigh: 45 };

  const ageLabel =
    a < 13 ? "<13" :
    a < 18 ? "13–17" :
    a < 26 ? "18–25" :
    a < 45 ? "26–44" :
    a < 65 ? "45–64" : "65+";

  return { ageLabel, steps, sleep, rhr, hrv };
}

export type Verdict = "low" | "in" | "high";

export function classify(value: number | null | undefined, bandLow: number, bandHigh: number): Verdict | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < bandLow) return "low";
  if (value > bandHigh) return "high";
  return "in";
}
