export type ContactOffer = "demo" | "trial" | "general";

export function parseContactOffer(value: string | null): ContactOffer {
  return value === "demo" || value === "trial" ? value : "general";
}

export function contactOfferLabelKey(offer: ContactOffer) {
  return offer === "demo" ? "contactOfferDemo" : offer === "trial" ? "contactOfferTrial" : "contactOfferGeneral";
}