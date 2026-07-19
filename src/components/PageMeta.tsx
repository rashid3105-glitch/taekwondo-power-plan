import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
}

export const PageMeta = ({ title, description, canonical, noindex, ogType, ogImage }: PageMetaProps) => {
  useEffect(() => {
    const suffix = "Sportstalent";
    // Only append the brand suffix if the title doesn't already contain it
    document.title = title.toLowerCase().includes(suffix.toLowerCase())
      ? title
      : `${title} | ${suffix}`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }

    // Ensure a canonical <link> exists so we can set it per-route
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    if (canonical) {
      canonicalEl.setAttribute("href", canonical);
    }


    // Update og:url
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (canonical && ogUrl) {
      ogUrl.setAttribute("content", canonical);
    }

    // Update og:title and twitter:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", document.title);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", document.title);

    // Update og:type
    const ogTypeEl = document.querySelector('meta[property="og:type"]');
    if (ogTypeEl) ogTypeEl.setAttribute("content", ogType || "website");

    // Update og:image / twitter:image per-page
    if (ogImage) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute("content", ogImage);
      const twImg = document.querySelector('meta[name="twitter:image"]');
      if (twImg) twImg.setAttribute("content", ogImage);
    }

    // Update og:description and twitter:description
    if (description) {
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", description);
    }

    // Handle noindex
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute("content", noindex ? "noindex, nofollow" : "index, follow");
    }

    return () => {
      // Reset robots on unmount
      if (noindex && robotsMeta) {
        robotsMeta.setAttribute("content", "index, follow");
      }
    };
  }, [title, description, canonical, noindex, ogType, ogImage]);

  return null;
};
