import { describe, it, expect } from "vitest";
import { buildStrengthTemplatePlan } from "./strengthTemplate";

describe("strength template", () => {
  it("supports 4, 5 and 6 week blocks ending in deload", () => {
    for (const w of [4, 5, 6] as const) {
      const p = buildStrengthTemplatePlan(w, "da");
      expect(p.periodization).toHaveLength(w);
      expect(p.periodization[w - 1].volumePercent).toBe(50);
    }
  });
  it("has 6 training days each with a taekwondo session and a full rest day", () => {
    const p = buildStrengthTemplatePlan(6, "en");
    expect(p.weeklySchedule).toHaveLength(7);
    p.weeklySchedule.slice(0, 6).forEach((d) => expect(d.sessions.some((s: any) => s.type === "tkd")).toBe(true));
    expect(p.weeklySchedule[6].sessions[0].type).toBe("rest");
  });
  it("day 1 starts with the uploaded baseline exercises", () => {
    const ex = buildStrengthTemplatePlan(4, "en").weeklySchedule[0].sessions[0].exercises;
    expect(ex[3]).toMatchObject({ name: "Back Squat", sets: 3, reps: "8" });
  });
});
