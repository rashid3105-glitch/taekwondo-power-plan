import { describe, expect, it } from "vitest";
import { buildOutreach, outreachOverviewHtml } from "./clubOutreach";

const input = { club: "Østerbro TKD", contact: "Mette", challenge: "Ugeplaner", group: "Ungdomshold", next: "Ring torsdag" };
describe("club outreach personalization", () => {
  it("personalizes all three materials to the specified club", () => {
    const result = buildOutreach(input, { script: "{club}: {group}", email: "{contact}: {challenge}. {next}", overview: "{club}: {challenge}" });
    expect(result).toEqual({ script: "Østerbro TKD: Ungdomshold", email: "Mette: Ugeplaner. Ring torsdag", overview: "Østerbro TKD: Ugeplaner" });
  });
  it("requires concrete club details", () => {
    expect(() => buildOutreach({ ...input, club: " " }, { script: "{club}", email: "{club}", overview: "{club}" })).toThrow();
  });
  it("does not interpret contact details as template instructions", () => {
    expect(buildOutreach({ ...input, club: "{contact}" }, { script: "{club}", email: "{club}", overview: "{club}" }).script).toBe("{contact}");
  });
  it("escapes user content in printable exports and supports Arabic direction", () => {
    const html = outreachOverviewHtml("<script>", '<img src=x onerror="alert(1)">', "ar");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("&lt;img");
  });
});