import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown, ChevronUp, Youtube, Plus, Pencil, Trash2, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useMySportProfile } from "@/hooks/useMySportProfile";
import { DrillFormDialog, type DrillRecord } from "@/components/library/DrillFormDialog";
import type { TranslationKey } from "@/i18n/translations";

export const DRILL_UPLOAD_LIMIT = 5;
export const DRILL_MAX_BYTES = 10 * 1024 * 1024;

const BASE_CATEGORIES = ["technique", "combinations", "footwork", "sparring", "conditioning", "other"] as const;
const TKD_CATEGORIES = ["taegeuk", "poomse"] as const;

export type DrillCategory = (typeof BASE_CATEGORIES)[number] | (typeof TKD_CATEGORIES)[number];

export const CATEGORY_LABEL_KEY: Record<DrillCategory, TranslationKey> = {
  technique: "drillCatTechnique" as TranslationKey,
  combinations: "drillCatCombinations" as TranslationKey,
  footwork: "drillCatFootwork" as TranslationKey,
  sparring: "drillCatSparring" as TranslationKey,
  conditioning: "drillCatConditioning" as TranslationKey,
  other: "drillCatOther" as TranslationKey,
  taegeuk: "drillCatTaegeuk" as TranslationKey,
  poomse: "drillCatPoomse" as TranslationKey,
};

function extractYouTubeId(url: string | null): string {
  if (!url) return "";
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

export function DrillLibrary() {
  const { t } = useLanguage();
  const { activeClubId, activeMembership } = useActiveClub();
  const { profile: sportProfile } = useMySportProfile();
  const isCoach = activeMembership?.role_in_club === "coach" || activeMembership?.role_in_club === "admin";

  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DrillRecord | null>(null);

  const categories = useMemo<DrillCategory[]>(
    () => (sportProfile?.slug === "taekwondo"
      ? [...BASE_CATEGORIES, ...TKD_CATEGORIES]
      : [...BASE_CATEGORIES]),
    [sportProfile?.slug],
  );

  const load = useCallback(async () => {
    if (!activeClubId) { setDrills([]); setLoading(false); return; }
    setLoading(true);
    let q = (supabase as any)
      .from("club_drills")
      .select("id,title,description,video_url,category,club_id,sort_order,is_active,source,storage_path,file_size_bytes")
      .eq("club_id", activeClubId)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (!isCoach) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (!error) setDrills((data as DrillRecord[]) || []);
    setLoading(false);
  }, [activeClubId, isCoach]);

  useEffect(() => { void load(); }, [load]);

  const uploadCount = useMemo(() => drills.filter((d) => d.source === "upload").length, [drills]);

  const grouped = useMemo(() => {
    const map: Record<string, DrillRecord[]> = {};
    for (const c of categories) map[c] = [];
    for (const d of drills) {
      const key = (map[d.category] ? d.category : "other") as string;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [drills, categories]);

  const handleDelete = async (drill: DrillRecord) => {
    if (!window.confirm(t("drillsDeleteConfirm" as TranslationKey))) return;
    if (drill.storage_path) {
      await supabase.storage.from("club-drills").remove([drill.storage_path]);
    }
    const { error } = await (supabase as any).from("club_drills").delete().eq("id", drill.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("drillsDeletedToast" as TranslationKey));
    void load();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("drillsIntroClub" as TranslationKey)}</p>

      {isCoach && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {t("drillsQuotaUsed" as TranslationKey).replace("{used}", String(uploadCount))}
            </span>
            <Button
              size="sm"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("drillsAdd" as TranslationKey)}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("drillsBestPractice" as TranslationKey)}
          </p>
        </div>
      )}

      {drills.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t("drillsEmptyClub" as TranslationKey)}
        </div>
      )}

      {categories.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const isOpen = !!openCats[cat];
        return (
          <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenCats((o) => ({ ...o, [cat]: !o[cat] }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
            >
              <span className="font-bold text-card-foreground text-sm">{t(CATEGORY_LABEL_KEY[cat])}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{items.length}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2 animate-slide-up">
                {items.map((d) => (
                  <DrillRow
                    key={d.id}
                    drill={d}
                    canManage={isCoach}
                    onEdit={() => { setEditing(d); setDialogOpen(true); }}
                    onDelete={() => handleDelete(d)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {isCoach && activeClubId && (
        <DrillFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          clubId={activeClubId}
          drill={editing}
          categories={categories}
          uploadCount={uploadCount}
          onSaved={() => { setDialogOpen(false); void load(); }}
        />
      )}
    </div>
  );
}

function DrillRow({
  drill, canManage, onEdit, onDelete,
}: { drill: DrillRecord; canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const ytId = extractYouTubeId(drill.video_url);
  const isUpload = drill.source === "upload" && !!drill.storage_path;

  useEffect(() => {
    if (!expanded || !isUpload || signedUrl) return;
    (async () => {
      const { data } = await supabase.storage.from("club-drills").createSignedUrl(drill.storage_path!, 3600);
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    })();
  }, [expanded, isUpload, signedUrl, drill.storage_path]);

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground overflow-hidden">
      <div className="w-full flex items-center gap-3 px-3 py-2.5">
        <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {isUpload && (
            <span title={t("drillsUploadBadge" as TranslationKey)} className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/15 text-primary flex-shrink-0">
              <Video className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="font-semibold text-sm text-card-foreground flex-1 truncate">{drill.title}</span>
          {!drill.is_active && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">•</span>}
        </button>
        {!isUpload && drill.video_url && (
          <a
            href={drill.video_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="YouTube"
            className="flex items-center justify-center h-7 w-7 rounded-md bg-red-600/15 text-red-600 hover:bg-red-600/25 transition-colors flex-shrink-0"
          >
            <Youtube className="h-4 w-4" />
          </a>
        )}
        {canManage && (
          <>
            <button onClick={onEdit} title={t("drillsEdit" as TranslationKey)} className="flex items-center justify-center h-7 w-7 rounded-md text-primary hover:bg-primary/10">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={onDelete} title={t("delete")} className="flex items-center justify-center h-7 w-7 rounded-md text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </>
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
            <p className="text-xs text-card-foreground/85 leading-relaxed whitespace-pre-wrap">{drill.description}</p>
          )}
          {isUpload && signedUrl && (
            <video src={signedUrl} controls playsInline className="w-full rounded-lg border border-border bg-black aspect-video" />
          )}
          {!isUpload && ytId && (
            <a
              href={drill.video_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-border bg-black aspect-video relative group"
              aria-label={t("drillsPlay" as TranslationKey)}
            >
              <img
                src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`; }}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 ml-0.5 fill-black"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
