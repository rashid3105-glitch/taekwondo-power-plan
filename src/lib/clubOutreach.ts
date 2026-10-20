export type OutreachInput = { club: string; contact: string; challenge: string; group: string; next: string };
export type OutreachMaterials = { script: string; email: string; overview: string };

/** Single-pass replacement: user values are data, never further templates. */
export function personalizeOutreach(template: string, input: OutreachInput): string {
  return template.replace(/\{(club|contact|challenge|group|next)\}/g, (_, key: keyof OutreachInput) => input[key].trim());
}

export function buildOutreach(input: OutreachInput, templates: OutreachMaterials): OutreachMaterials {
  if (!input.club.trim() || !input.contact.trim() || !input.challenge.trim() || !input.group.trim() || !input.next.trim()) {
    throw new Error("Missing outreach details");
  }
  return Object.fromEntries(Object.entries(templates).map(([key, template]) => [key, personalizeOutreach(template, input)])) as OutreachMaterials;
}

export function escapeOutreachHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

export function outreachOverviewHtml(title: string, body: string, locale: string): string {
  return `<!doctype html><html lang="${escapeOutreachHtml(locale)}" dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${escapeOutreachHtml(title)}</title><style>@page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.55;max-width:170mm;margin:20mm auto;color:#20252b}h1{font-size:24pt;color:#1f5bd8;border-bottom:2px solid #1f5bd8;padding-bottom:12px}p{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#525c69}@media print{body{margin:0}}</style></head><body><small>SPORTS TALENT · Made for More. Built to Perform.</small><h1>${escapeOutreachHtml(title)}</h1><p>${escapeOutreachHtml(body)}</p></body></html>`;
}