import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description?: string;
}

export const PageMeta = ({ title, description }: PageMetaProps) => {
  useEffect(() => {
    const suffix = "Sportstalent";
    document.title = title === suffix ? title : `${title} | ${suffix}`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }
  }, [title, description]);

  return null;
};
