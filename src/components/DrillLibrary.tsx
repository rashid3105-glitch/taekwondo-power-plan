import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown, ChevronUp, Globe2, Youtube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const CATEGORIES = ["kicks", "combinations", "footwork", "taegeuk", "poomse", "sparring", "conditioning"] as const;
type DrillCategory = (typeof CATEGORIES)[number];

const CATEGORY_LABEL_KEY: Record<DrillCategory, TranslationKey> = {
  kicks: "drillCatKicks",
  combinations: "drillCatCombinations",
  footwork: "drillCatFootwork",
  taegeuk: "drillCatTaegeuk",
  poomse: "drillCatPoomse",
  sparring: "drillCatSparring",
  conditioning: "drillCatConditioning",
};

interface Drill {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: DrillCategory;
  club_id: string | null;
  sort_order: number;
}

function extractYouTubeId(url: string | null): string {
  if (!url) return "";
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

export function DrillLibrary() {
  const { t } = useLanguage();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("taekwondo_drills")
        .select("id,title,description,video_url,category,club_id,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (!error) setDrills((data as Drill[]) || []);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Drill[]> = {};
    for (const c of CATEGORIES) map[c] = [];
    for (const d of drills) {
      if (map[d.category]) map[d.category].push(d);
    }
    return map;
  }, [drills]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (drills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {t("drillsEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("drillsIntro")}</p>
      {CATEGORIES.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const isOpen = !!openCats[cat];
        return (
          <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenCats((o) => ({ ...o, [cat]: !o[cat] }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
            >
              <span className="font-bold text-card-foreground text-sm">
                {t(CATEGORY_LABEL_KEY[cat])}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{items.length}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2 animate-slide-up">
                {items.map((d) => <DrillRow key={d.id} drill={d} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DrillRow({ drill }: { drill: Drill }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const ytId = extractYouTubeId(drill.video_url);
  const youtubeHref = drill.video_url
    || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(drill.title + " taekwondo")}`);

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
      <div className="w-full flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {drill.club_id === null && (
            <span title={t("drillsGlobalBadge")} className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/15 text-primary flex-shrink-0">
              <Globe2 className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="font-semibold text-sm text-card-foreground flex-1 truncate">{drill.title}</span>
        </button>
        {drill.video_url && (
          <a
            href={youtubeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="YouTube"
            className="flex items-center justify-center h-7 w-7 rounded-md bg-red-600/15 text-red-600 hover:bg-red-600/25 transition-colors flex-shrink-0"
          >
            <Youtube className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {drill.description && (
            <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{drill.description}</p>
          )}
          {ytId && (
            <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                title={drill.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
