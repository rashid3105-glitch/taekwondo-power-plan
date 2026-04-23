import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface Announcement {
  id: string;
  text_en: string;
  text_da: string;
  text_sv: string;
  text_de: string;
  text_ar: string;
  text_no: string;
  link_url: string;
}

export const WhatsNewInline = () => {
  const { locale, t } = useLanguage();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("landing_announcements")
        .select("id, text_en, text_da, text_sv, text_de, text_ar, text_no, link_url")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setAnnouncement(data as Announcement);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement) return null;

  const localizedText =
    (announcement[`text_${locale}` as keyof Announcement] as string)?.trim() ||
    announcement.text_en?.trim();

  if (!localizedText) return null;

  const isExternal = /^https?:\/\//.test(announcement.link_url);

  const linkContent = (
    <>
      <Sparkles className="h-3 w-3 text-energy" aria-hidden="true" />
      <span className="font-semibold text-foreground/80">{t("whatsNewPrefix")}:</span>
      <span className="text-muted-foreground">{localizedText}</span>
      <span className="underline underline-offset-2 text-foreground/70 hover:text-foreground transition-colors">
        {t("whatsNewLink")}
      </span>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.85 }}
      className="mt-3 text-[11px] sm:text-xs"
    >
      {isExternal ? (
        <a
          href={announcement.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 flex-wrap"
        >
          {linkContent}
        </a>
      ) : (
        <Link
          to={announcement.link_url || "/help#changelog"}
          className="inline-flex items-center gap-1.5 flex-wrap"
        >
          {linkContent}
        </Link>
      )}
    </motion.div>
  );
};
