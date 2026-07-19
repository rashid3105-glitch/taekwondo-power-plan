import { Helmet } from "react-helmet-async";

const SITE = "https://sportstalent.dk";

interface PublicSeoProps {
  title: string;
  description: string;
  path: string; // e.g. "/methodology"
  ogType?: "website" | "article";
  ogImage?: string;
}

/**
 * Public marketing pages — unique title/description/canonical + og/twitter.
 * Overrides the app-wide default noindex.
 */
export const PublicSeo = ({ title, description, path, ogType = "website", ogImage }: PublicSeoProps) => {
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
};

/** App-wide default: everything is noindex unless a page explicitly opts in. */
export const DefaultNoIndex = () => (
  <Helmet>
    <meta name="robots" content="noindex, nofollow" />
  </Helmet>
);
