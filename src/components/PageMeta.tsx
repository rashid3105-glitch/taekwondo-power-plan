import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { publicSeoPaths } from "@/components/seo/publicSeoRegistry";

interface PageMetaProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
}

/**
 * Per-page head tags. Rendered through react-helmet-async so the page's own
 * (translated) values win over the route-level PublicSeo defaults in App.tsx —
 * deeper Helmet instances take precedence.
 */
export const PageMeta = ({ title, description, canonical, noindex, ogType, ogImage }: PageMetaProps) => {
  const { pathname } = useLocation();
  if (publicSeoPaths.has(pathname)) return null;
  const suffix = "Sportstalent";
  const fullTitle = title.toLowerCase().includes(suffix.toLowerCase()) || title.includes("سبورتستالنت") ? title : `${title} | ${suffix}`;
  const robots = noindex ? "noindex, nofollow" : canonical ? "index, follow" : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:title" content={fullTitle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta property="og:type" content={ogType || "website"} />
      {description ? <meta property="og:description" content={description} /> : null}
      {description ? <meta name="twitter:description" content={description} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
};
