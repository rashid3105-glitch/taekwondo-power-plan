import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ArrowLeft, Plus, Video as VideoIcon, Upload, Download, WifiOff, RefreshCw, Trash2, CloudUpload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { PageMeta } from "@/components/PageMeta";
import { VideoTagger } from "@/components/match/VideoTagger";
import type { Discipline } from "@/lib/tkdTechniques";
import { useMatchOffline } from "@/hooks/useMatchOffline";
import {
  cacheVideo, removeCachedVideo, queueOutboxUpload, removeOutboxUpload,
  makeTempId, type CachedVideoMeta,
} from "@/lib/matchOfflineDB";

interface MatchVideoRow {
  id: string;
  athlete_id: string;
  coach_id: string;
  title: string;
  notes: string;
  storage_path: string;
  duration_seconds: number | null;
  discipline: Discipline;
  opponent_name: string | null;
  event_name: string | null;
  match_date: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  poomsae_type: "individual" | "pair" | "team" | null;
  athlete_age: string | null;
  __pending?: boolean; // synthetic row from outbox
  __outboxId?: string;
}

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

export default function MatchAnalysis() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const offline = useMatchOffline();
  const [me, setMe] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [athleteName, setAthleteName] = useState<string>("");
  const [resolvedAthleteId, setResolvedAthleteId] = useState<string | null>(null);
  const [serverVideos, setServerVideos] = useState<MatchVideoRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Upload form
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState<Discipline>("sparring");
  const [opponent, setOpponent] = useState("");
  const [eventName, setEventName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [poomsaeType, setPoomsaeType] = useState<"individual" | "pair" | "team">("individual");
  const [athleteAge, setAthleteAge] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void init(); /* eslint-disable-next-line */ }, [athleteId, offline.online]);

  // Refresh once a queued upload completes (cached count grows or outbox shrinks)
  useEffect(() => {
    if (offline.online && offline.lastSync && offline.lastSync.uploaded > 0) {
      void init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline.lastSync]);

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    setMe(user.id);

    let coach = false;
    if (offline.online) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "coach").maybeSingle();
      coach = !!roleRow;
      // remember role for offline
      try { localStorage.setItem(`match.isCoach.${user.id}`, coach ? "1" : "0"); } catch { /* ignore */ }
    } else {
      coach = localStorage.getItem(`match.isCoach.${user.id}`) === "1";
    }
    setIsCoach(coach);

    const targetAthlete = athleteId === "me" || !athleteId ? user.id : athleteId;
    setResolvedAthleteId(targetAthlete);

    if (offline.online) {
      const { data: prof } = await supabase
        .from("profiles").select("display_name")
        .eq("user_id", targetAthlete).maybeSingle();
      const name = prof?.display_name || (targetAthlete === user.id ? t("matchYou") : t("matchAthlete"));
      setAthleteName(name);
      try { localStorage.setItem(`match.athleteName.${targetAthlete}`, name); } catch { /* ignore */ }

      const { data: vids } = await supabase
        .from("match_videos").select("*")
        .eq("athlete_id", targetAthlete)
        .order("created_at", { ascending: false });
      setServerVideos((vids || []) as MatchVideoRow[]);
    } else {
      setAthleteName(localStorage.getItem(`match.athleteName.${targetAthlete}`) || t("matchAthlete"));
      setServerVideos([]); // when offline we render from cache + outbox
    }
    setLoading(false);
  }

  // Combine: server videos (deduped) + cached metas not in server list (offline) + outbox uploads.
  const videos = useMemo<MatchVideoRow[]>(() => {
    const map = new Map<string, MatchVideoRow>();
    if (offline.online) {
      for (const v of serverVideos) {
        if (resolvedAthleteId && v.athlete_id !== resolvedAthleteId) continue;
        map.set(v.id, v);
      }
    } else {
      // offline: only cached videos for this athlete
      for (const m of offline.cachedMetas) {
        if (resolvedAthleteId && m.athlete_id !== resolvedAthleteId) continue;
        map.set(m.id, cachedToRow(m));
      }
    }
    const merged = Array.from(map.values());
    // Append outbox uploads as synthetic pending rows
    for (const u of offline.outbox) {
      if (resolvedAthleteId && u.athlete_id !== resolvedAthleteId) continue;
      merged.unshift({
        id: u.id,
        athlete_id: u.athlete_id,
        coach_id: u.coach_id,
        title: u.title,
        notes: "",
        storage_path: "",
        duration_seconds: u.duration_seconds,
        discipline: u.discipline as Discipline,
        opponent_name: u.opponent_name,
        event_name: u.event_name,
        match_date: u.match_date,
        share_token: null,
        share_expires_at: null,
        created_at: new Date(u.created_at).toISOString(),
        poomsae_type: (u as any).poomsae_type ?? null,
        athlete_age: (u as any).athlete_age ?? null,
        __pending: true,
        __outboxId: u.id,
      });
    }
    return merged;
  }, [serverVideos, offline.cachedMetas, offline.outbox, offline.online, resolvedAthleteId]);

  useEffect(() => {
    if (!activeId && videos.length > 0) setActiveId(videos[0].id);
    if (activeId && !videos.find((v) => v.id === activeId) && videos.length > 0) {
      setActiveId(videos[0].id);
    }
  }, [videos, activeId]);

  function cachedToRow(m: CachedVideoMeta): MatchVideoRow {
    return {
      id: m.id,
      athlete_id: m.athlete_id,
      coach_id: m.coach_id,
      title: m.title,
      notes: m.notes,
      storage_path: m.storage_path,
      duration_seconds: m.duration_seconds,
      discipline: m.discipline as Discipline,
      opponent_name: m.opponent_name,
      event_name: m.event_name,
      match_date: m.match_date,
      share_token: m.share_token,
      share_expires_at: m.share_expires_at,
      created_at: m.created_at,
      poomsae_type: (m as any).poomsae_type ?? null,
      athlete_age: (m as any).athlete_age ?? null,
    };
  }

  async function downloadForOffline(v: MatchVideoRow) {
    if (!navigator.onLine) {
      toast({ title: t("matchOfflineNoConnection"), variant: "destructive" });
      return;
    }
    setDownloadingId(v.id);
    try {
      const { data: signed, error } = await supabase.storage
        .from("match_videos").createSignedUrl(v.storage_path, 60 * 60);
      if (error || !signed?.signedUrl) throw error || new Error("No URL");
      const res = await fetch(signed.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      await cacheVideo(
        {
          id: v.id, athlete_id: v.athlete_id, coach_id: v.coach_id, title: v.title, notes: v.notes,
          storage_path: v.storage_path, duration_seconds: v.duration_seconds, discipline: v.discipline,
          opponent_name: v.opponent_name, event_name: v.event_name, match_date: v.match_date,
          share_token: v.share_token, share_expires_at: v.share_expires_at, created_at: v.created_at,
          cached_at: Date.now(), size_bytes: blob.size,
        },
        blob,
      );
      await offline.refresh();
      toast({ title: t("matchOfflineSavedToast") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  }

  async function removeFromOffline(id: string) {
    await removeCachedVideo(id);
    await offline.refresh();
    toast({ title: t("matchOfflineRemovedToast") });
  }

  async function cancelQueuedUpload(outboxId: string) {
    await removeOutboxUpload(outboxId);
    await offline.refresh();
  }

  async function handleUpload() {
    if (!file || !title || !me || !resolvedAthleteId) return;
    if (file.size > MAX_BYTES) {
      toast({ title: t("matchFileTooLarge"), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const duration = await readDuration(file).catch(() => null);

      // Resolve club_id (offline-safe)
      let clubId: string | null = null;
      if (navigator.onLine) {
        const { data: athleteProf } = await supabase
          .from("profiles").select("club_id")
          .eq("user_id", resolvedAthleteId).maybeSingle();
        clubId = athleteProf?.club_id ?? null;
      }

      if (navigator.onLine) {
        // Direct upload path
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${me}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("match_videos").upload(path, file, {
          cacheControl: "3600", upsert: false,
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("match_videos").insert({
          athlete_id: resolvedAthleteId, coach_id: me, club_id: clubId,
          title, storage_path: path, duration_seconds: duration, discipline,
          opponent_name: opponent || null, event_name: eventName || null, match_date: matchDate || null,
          poomsae_type: discipline === "poomsae" ? poomsaeType : null,
          athlete_age: athleteAge.trim() || null,
        });
        if (insErr) throw insErr;
        toast({ title: t("matchUploadSuccess") });
      } else {
        // Queue in outbox
        await queueOutboxUpload({
          id: makeTempId("upl"),
          athlete_id: resolvedAthleteId, coach_id: me, club_id: clubId,
          title, discipline,
          opponent_name: opponent || null, event_name: eventName || null,
          match_date: matchDate || null, duration_seconds: duration,
          file, file_name: file.name, created_at: Date.now(), status: "pending",
          poomsae_type: discipline === "poomsae" ? poomsaeType : null,
          athlete_age: athleteAge.trim() || null,
        } as any);
        toast({ title: t("matchOfflineQueuedToast") });
      }

      setTitle(""); setOpponent(""); setEventName(""); setMatchDate(""); setFile(null); setAthleteAge(""); setPoomsaeType("individual");
      setUploadOpen(false);
      await Promise.all([init(), offline.refresh()]);
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function readDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => {
        const d = v.duration;
        URL.revokeObjectURL(url);
        resolve(Math.round(d));
      };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video")); };
    });
  }

  const activeVideo = videos.find((v) => v.id === activeId);
  const pendingTotal = offline.pendingTagCount + offline.pendingDeleteCount + offline.outbox.length;

  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta title={`${t("matchAnalysisTitle")} · ${athleteName}`} description={t("matchAnalysisMetaDesc")} noindex />
      <Watermark />
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("matchBack")}
            </Button>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <VideoIcon className="h-6 w-6 text-primary" />
              {t("matchAnalysisTitle")}
              <span className="text-sm text-muted-foreground font-normal">· {athleteName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!offline.online && (
              <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                <WifiOff className="h-3 w-3" /> {t("matchOfflineNoConnection")}
              </Badge>
            )}
            {pendingTotal > 0 && (
              <Badge variant="outline" className="gap-1">
                {offline.syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
                {t("matchOfflinePendingBadge")}: {pendingTotal}
              </Badge>
            )}
            {offline.online && pendingTotal > 0 && (
              <Button size="sm" variant="outline" onClick={() => offline.runSync()}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${offline.syncing ? "animate-spin" : ""}`} />
                {t("matchOfflineUploading")}
              </Button>
            )}
            {isCoach && (
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> {t("matchUploadClip")}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{t("matchUploadClip")}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>{t("matchClipTitle")} *</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Round 1 vs Park" />
                    </div>
                    <div>
                      <Label>{t("matchDiscipline")}</Label>
                      <Select value={discipline} onValueChange={(v) => setDiscipline(v as Discipline)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sparring">{t("matchDisciplineSparring")}</SelectItem>
                          <SelectItem value="poomsae">{t("matchDisciplinePoomsae")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {discipline === "poomsae" && (
                      <div>
                        <Label>{t("matchPoomsaeType")}</Label>
                        <Select value={poomsaeType} onValueChange={(v) => setPoomsaeType(v as any)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">{t("matchPoomsaeIndividual")}</SelectItem>
                            <SelectItem value="pair">{t("matchPoomsaePair")}</SelectItem>
                            <SelectItem value="team">{t("matchPoomsaeTeam")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>{t("matchAthleteAge")}</Label>
                      <Input
                        value={athleteAge}
                        onChange={(e) => setAthleteAge(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                        inputMode="numeric"
                        maxLength={3}
                        placeholder={t("matchAthleteAgePlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t("matchAthleteAgeHint")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{t("matchOpponent")}</Label>
                        <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("matchEvent")}</Label>
                        <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>{t("matchDate")}</Label>
                      <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t("matchVideoFile")} (mp4/mov, max 200MB)</Label>
                      <Input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                    {!offline.online && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <WifiOff className="h-3 w-3" /> {t("matchOfflineQueueUpload")}
                      </div>
                    )}
                    <Button onClick={handleUpload} disabled={uploading || !file || !title} className="w-full">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      {t("matchUpload")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto mt-12" />
        ) : videos.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-sm text-muted-foreground">
            <VideoIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            {isCoach ? t("matchEmptyCoach") : t("matchEmptyAthlete")}
          </CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-[280px_1fr] gap-4">
            <Card className="lg:sticky lg:top-4 self-start max-h-[80vh] overflow-auto">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("matchClipsList")}</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {videos.map((v) => {
                  const cached = offline.cachedIds.has(v.id);
                  const isActive = activeId === v.id;
                  const disabled = !offline.online && !cached && !v.__pending;
                  return (
                    <div
                      key={v.id}
                      className={`px-2 py-2 rounded text-xs ${isActive ? "bg-primary/10 border border-primary/40" : "hover:bg-muted border border-transparent"} ${disabled ? "opacity-50" : ""}`}
                    >
                      <button
                        onClick={() => !disabled && setActiveId(v.id)}
                        disabled={disabled}
                        className="w-full text-left"
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          {v.title}
                          {v.__pending && (
                            <Badge variant="outline" className="text-[9px] h-4 ml-1">
                              <CloudUpload className="h-2.5 w-2.5 mr-0.5" />
                              {t("matchOfflineQueueUpload")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2 flex-wrap mt-0.5">
                          <span>{v.discipline === "poomsae" ? t("matchDisciplinePoomsae") : t("matchDisciplineSparring")}</span>
                          {v.match_date && <span>· {v.match_date}</span>}
                          {cached && (
                            <span className="text-primary flex items-center gap-0.5">
                              · <Download className="h-2.5 w-2.5" /> {t("matchOfflineCached")}
                            </span>
                          )}
                        </div>
                      </button>
                      {!v.__pending && (
                        <div className="flex gap-1 mt-1">
                          {cached ? (
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => removeFromOffline(v.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t("matchOfflineRemove")}
                            </Button>
                          ) : offline.online ? (
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 text-[10px] px-2"
                              disabled={downloadingId === v.id}
                              onClick={() => downloadForOffline(v)}
                            >
                              {downloadingId === v.id
                                ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                : <Download className="h-3 w-3 mr-1" />}
                              {downloadingId === v.id ? t("matchOfflineDownloading") : t("matchOfflineDownload")}
                            </Button>
                          ) : null}
                        </div>
                      )}
                      {v.__pending && v.__outboxId && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 text-[10px] px-2 mt-1"
                          onClick={() => cancelQueuedUpload(v.__outboxId!)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t("matchOfflineRemove")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <div>
              {activeVideo && !activeVideo.__pending && (
                <VideoTagger
                  video={activeVideo}
                  isCoach={isCoach && activeVideo.coach_id === me}
                  isOffline={!offline.online}
                  isCached={offline.cachedIds.has(activeVideo.id)}
                  onChanged={() => { void offline.refresh(); }}
                  onDeleted={() => { setActiveId(null); void init(); void offline.refresh(); }}
                />
              )}
              {activeVideo?.__pending && (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground text-center space-y-2">
                    <CloudUpload className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <div>{t("matchOfflineQueueUpload")}</div>
                    {!offline.online && <div className="text-xs">{t("matchOfflineNoConnection")}</div>}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
