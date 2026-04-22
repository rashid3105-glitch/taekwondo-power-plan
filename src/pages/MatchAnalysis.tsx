import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Video as VideoIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { PageMeta } from "@/components/PageMeta";
import { VideoTagger } from "@/components/match/VideoTagger";
import type { Discipline } from "@/lib/tkdTechniques";

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
}

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

export default function MatchAnalysis() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [me, setMe] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [athleteName, setAthleteName] = useState<string>("");
  const [resolvedAthleteId, setResolvedAthleteId] = useState<string | null>(null);
  const [videos, setVideos] = useState<MatchVideoRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState<Discipline>("sparring");
  const [opponent, setOpponent] = useState("");
  const [eventName, setEventName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void init(); /* eslint-disable-next-line */ }, [athleteId]);

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    setMe(user.id);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "coach")
      .maybeSingle();
    const coach = !!roleRow;
    setIsCoach(coach);

    let targetAthlete = athleteId === "me" || !athleteId ? user.id : athleteId;
    setResolvedAthleteId(targetAthlete);

    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", targetAthlete)
      .maybeSingle();
    setAthleteName(prof?.display_name || (targetAthlete === user.id ? t("matchYou") : t("matchAthlete")));

    const { data: vids } = await supabase
      .from("match_videos")
      .select("*")
      .eq("athlete_id", targetAthlete)
      .order("created_at", { ascending: false });
    setVideos((vids || []) as MatchVideoRow[]);
    setActiveId((vids && vids[0]?.id) || null);
    setLoading(false);
  }

  async function handleUpload() {
    if (!file || !title || !me || !resolvedAthleteId) return;
    if (file.size > MAX_BYTES) {
      toast({ title: t("matchFileTooLarge"), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${me}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("match_videos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      // Try to read duration
      const duration = await readDuration(file).catch(() => null);

      // Find athlete's club for denormalized access
      const { data: athleteProf } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", resolvedAthleteId)
        .maybeSingle();

      const { error: insErr } = await supabase.from("match_videos").insert({
        athlete_id: resolvedAthleteId,
        coach_id: me,
        club_id: athleteProf?.club_id ?? null,
        title,
        storage_path: path,
        duration_seconds: duration,
        discipline,
        opponent_name: opponent || null,
        event_name: eventName || null,
        match_date: matchDate || null,
      });
      if (insErr) throw insErr;

      toast({ title: t("matchUploadSuccess") });
      setTitle(""); setOpponent(""); setEventName(""); setMatchDate(""); setFile(null);
      setUploadOpen(false);
      await init();
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
                  <Button onClick={handleUpload} disabled={uploading || !file || !title} className="w-full">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    {t("matchUpload")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto mt-12" />
        ) : videos.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-sm text-muted-foreground">
            <VideoIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            {isCoach ? t("matchEmptyCoach") : t("matchEmptyAthlete")}
          </CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-[260px_1fr] gap-4">
            <Card className="lg:sticky lg:top-4 self-start max-h-[80vh] overflow-auto">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("matchClipsList")}</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {videos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveId(v.id)}
                    className={`w-full text-left px-2 py-2 rounded text-xs ${activeId === v.id ? "bg-primary/10 border border-primary/40" : "hover:bg-muted"}`}
                  >
                    <div className="font-medium truncate">{v.title}</div>
                    <div className="text-[10px] text-muted-foreground flex gap-2">
                      <span>{v.discipline === "poomsae" ? t("matchDisciplinePoomsae") : t("matchDisciplineSparring")}</span>
                      {v.match_date && <span>· {v.match_date}</span>}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
            <div>
              {activeVideo && (
                <VideoTagger
                  video={activeVideo}
                  isCoach={isCoach && activeVideo.coach_id === me}
                  onChanged={init}
                  onDeleted={init}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
