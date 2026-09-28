import { useState } from "react";
import { Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

type Provider = "youtube" | "vimeo";

interface Props {
  /** YouTube video id (or Vimeo id when provider="vimeo") */
  videoId: string;
  title: string;
  provider?: Provider;
  className?: string;
}

/**
 * GDPR click-to-play video embed. No request is made to YouTube/Vimeo
 * (not even thumbnails) until the user clicks. YouTube uses youtube-nocookie.
 */
export function YouTubeEmbed({ videoId, title, provider = "youtube", className }: Props) {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  const providerName = provider === "vimeo" ? "Vimeo" : "YouTube";

  const src =
    provider === "vimeo"
      ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?autoplay=1&dnt=1`
      : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden border border-border bg-muted", className)}>
      {active ? (
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center bg-gradient-to-br from-muted to-card hover:from-card hover:to-muted transition-colors"
          aria-label={`${t("videoConsentPlay")}: ${title}`}
          title={t("videoConsentPlay")}
        >
          <span className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
          </span>
          <span className="text-xs text-muted-foreground max-w-xs">
            {t("videoConsentNotice").split("{provider}").join(providerName)}
          </span>
        </button>
      )}
    </div>
  );
}

export default YouTubeEmbed;
