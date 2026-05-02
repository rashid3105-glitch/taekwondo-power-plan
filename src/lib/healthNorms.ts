// Healthy adult athlete reference values used as a baseline norm in
// the Health page charts. Sources: WHO physical activity guidelines,
// AHA resting HR ranges for trained adults, common HRV (RMSSD) literature.

export const healthNorms = {
  steps: {
    target: 10000,
    low: 5000,
    bandLow: 7000,
    bandHigh: 12000,
    unit: "",
  },
  // sleep stored as hours
  sleep: {
    target: 8,
    low: 7,
    high: 9,
    bandLow: 7,
    bandHigh: 9,
    unit: "h",
  },
  // resting heart rate, bpm
  rhr: {
    target: 58,
    bandLow: 50,
    bandHigh: 65,
    unit: " bpm",
  },
  // HRV RMSSD, ms
  hrv: {
    target: 60,
    bandLow: 50,
    bandHigh: 100,
    low: 30,
    unit: " ms",
  },
} as const;

export type NormVerdict = "below" | "in" | "above";

export function compareToBand(
  value: number | null | undefined,
  bandLow: number,
  bandHigh: number,
): NormVerdict | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < bandLow) return "below";
  if (value > bandHigh) return "above";
  return "in";
}
