/**
 * GAL licence, MyFightBook and the anti-doping e-learning course are
 * Danish federation requirements. Only show / alert on them for athletes
 * registered in Denmark.
 */
export function isDanishCountry(country?: string | null): boolean {
  const c = (country || "").trim().toLowerCase();
  return c === "denmark" || c === "danmark" || c === "dk";
}
