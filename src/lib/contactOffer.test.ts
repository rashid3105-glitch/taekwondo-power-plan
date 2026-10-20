import { describe, expect, it } from "vitest";
import { parseContactOffer } from "./contactOffer";

describe("contact offer selection", () => {
  it("keeps Book demo distinct from Try free", () => {
    expect(parseContactOffer("demo")).toBe("demo");
    expect(parseContactOffer("trial")).toBe("trial");
  });
  it("keeps ordinary contact available for missing or unknown offers", () => {
    expect(parseContactOffer(null)).toBe("general");
    expect(parseContactOffer("unexpected")).toBe("general");
  });
});