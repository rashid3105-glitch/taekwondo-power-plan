// Paths whose Danish head tags are owned by a route-level <PublicSeo> in App.tsx.
// PublicSeo renders before the page (sibling order), registers its path here, and
// PageMeta then skips title/description/og so the visitor's UI language can't
// override the canonical Danish metadata that crawlers should index.
export const publicSeoPaths = new Set<string>();
