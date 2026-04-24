import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Copy, Trophy, Video, Plus, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Achievement {
  id?: string;
  title: string;
  year: number | null;
  medal: string | null;
}

interface HighlightVideo {
  id?: string;
  url: string;
  title: string | null;
}

const VIDEO_URL_RE = /^https?:\/\/(www\.)?(youtube\.com\/|youtu\.be\/|vimeo\.com\/)/i;

export function PublicProfileSettings() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athleteCode, setAthleteCode] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [isPublic, setIsPublic] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showPRs, setShowPRs] = useState(true);
  const [showCompetitions, setShowCompetitions] = useState(true);
  const [showVideos, setShowVideos] = useState(true);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [videos, setVideos] = useState<HighlightVideo[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: profile }, { data: achs }, { data: vids }] = await Promise.all([
      supabase
        .from("profiles")
        .select("athlete_code, is_public, public_show_achievements, public_show_prs, public_show_competitions, public_show_videos")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("athlete_achievements")
        .select("id, title, year, medal, sort_order")
        .eq("user_id", user.id)
        .order("sort_order"),
      supabase
        .from("athlete_highlight_videos")
        .select("id, url, title, sort_order")
        .eq("user_id", user.id)
        .order("sort_order"),
    ]);

    if (profile) {
      setAthleteCode((profile as any).athlete_code || "");
      setIsPublic(!!(profile as any).is_public);
      setShowAchievements((profile as any).public_show_achievements ?? true);
      setShowPRs((profile as any).public_show_prs ?? true);
      setShowCompetitions((profile as any).public_show_competitions ?? true);
      setShowVideos((profile as any).public_show_videos ?? true);
    }
    setAchievements((achs || []).map((a: any) => ({ id: a.id, title: a.title, year: a.year, medal: a.medal })));
    setVideos((vids || []).map((v: any) => ({ id: v.id, url: v.url, title: v.title })));
    setLoading(false);
  }

  async function saveToggles(updates: Partial<{ is_public: boolean; public_show_achievements: boolean; public_show_prs: boolean; public_show_competitions: boolean; public_show_videos: boolean }>) {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    }
  }

  function shareUrl() {
    if (!athleteCode) return "";
    return `${window.location.origin}/athlete/${athleteCode}`;
  }

  async function copyLink() {
    const url = shareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("publicProfileCopied") });
    } catch {
      // ignore
    }
  }

  function addAchievement() {
    if (achievements.length >= 6) {
      toast({ title: t("publicProfileMaxAchievements"), variant: "destructive" });
      return;
    }
    setAchievements([...achievements, { title: "", year: new Date().getFullYear(), medal: null }]);
  }

  async function removeAchievement(idx: number) {
    const a = achievements[idx];
    if (a.id) {
      await supabase.from("athlete_achievements").delete().eq("id", a.id);
    }
    setAchievements(achievements.filter((_, i) => i !== idx));
  }

  async function saveAchievement(idx: number) {
    const a = achievements[idx];
    if (!a.title.trim()) return;
    setSaving(true);
    if (a.id) {
      await supabase.from("athlete_achievements").update({
        title: a.title.trim().slice(0, 200),
        year: a.year,
        medal: a.medal,
        sort_order: idx,
      }).eq("id", a.id);
    } else {
      const { data } = await supabase.from("athlete_achievements").insert({
        user_id: userId,
        title: a.title.trim().slice(0, 200),
        year: a.year,
        medal: a.medal,
        sort_order: idx,
      }).select("id").single();
      if (data) {
        const next = [...achievements];
        next[idx] = { ...a, id: (data as any).id };
        setAchievements(next);
      }
    }
    setSaving(false);
  }

  function addVideo() {
    if (videos.length >= 4) {
      toast({ title: t("publicProfileMaxVideos"), variant: "destructive" });
      return;
    }
    setVideos([...videos, { url: "", title: "" }]);
  }

  async function removeVideo(idx: number) {
    const v = videos[idx];
    if (v.id) {
      await supabase.from("athlete_highlight_videos").delete().eq("id", v.id);
    }
    setVideos(videos.filter((_, i) => i !== idx));
  }

  async function saveVideo(idx: number) {
    const v = videos[idx];
    if (!v.url.trim()) return;
    if (!VIDEO_URL_RE.test(v.url.trim())) {
      toast({ title: t("publicProfileVideoInvalid"), variant: "destructive" });
      return;
    }
    setSaving(true);
    if (v.id) {
      await supabase.from("athlete_highlight_videos").update({
        url: v.url.trim().slice(0, 500),
        title: v.title?.trim().slice(0, 100) || null,
        sort_order: idx,
      }).eq("id", v.id);
    } else {
      const { data, error } = await supabase.from("athlete_highlight_videos").insert({
        user_id: userId,
        url: v.url.trim().slice(0, 500),
        title: v.title?.trim().slice(0, 100) || null,
        sort_order: idx,
      }).select("id").single();
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else if (data) {
        const next = [...videos];
        next[idx] = { ...v, id: (data as any).id };
        setVideos(next);
      }
    }
    setSaving(false);
  }

  if (loading) return null;

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{t("publicProfileTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("publicProfileDesc")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium cursor-pointer" htmlFor="is-public">{t("publicProfileEnable")}</Label>
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={(v) => { setIsPublic(v); void saveToggles({ is_public: v }); }}
          />
        </div>

        {isPublic && athleteCode && (
          <>
            <div className="rounded-md border border-border bg-muted/40 p-2 flex items-center gap-2">
              <code className="text-[11px] flex-1 truncate text-muted-foreground">{shareUrl()}</code>
              <Button type="button" size="sm" variant="ghost" onClick={copyLink} className="h-7 px-2">
                <Copy className="h-3 w-3 mr-1" /> {t("publicProfileCopy")}
              </Button>
              <a href={shareUrl()} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="show-ach">{t("publicProfileShowAchievements")}</Label>
                <Switch id="show-ach" checked={showAchievements} onCheckedChange={(v) => { setShowAchievements(v); void saveToggles({ public_show_achievements: v }); }} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="show-prs">{t("publicProfileShowPRs")}</Label>
                <Switch id="show-prs" checked={showPRs} onCheckedChange={(v) => { setShowPRs(v); void saveToggles({ public_show_prs: v }); }} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="show-comp">{t("publicProfileShowCompetitions")}</Label>
                <Switch id="show-comp" checked={showCompetitions} onCheckedChange={(v) => { setShowCompetitions(v); void saveToggles({ public_show_competitions: v }); }} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="show-vid">{t("publicProfileShowVideos")}</Label>
                <Switch id="show-vid" checked={showVideos} onCheckedChange={(v) => { setShowVideos(v); void saveToggles({ public_show_videos: v }); }} />
              </div>
            </div>

            {/* Achievements editor */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1"><Trophy className="h-3 w-3" /> {t("publicProfileAchievements")}</Label>
                <Button type="button" size="sm" variant="ghost" onClick={addAchievement} disabled={achievements.length >= 6} className="h-7 px-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> {t("publicProfileAddAchievement")}
                </Button>
              </div>
              {achievements.map((a, idx) => (
                <div key={idx} className="space-y-1.5 p-2 rounded border border-border">
                  <Input
                    value={a.title}
                    onChange={(e) => { const n = [...achievements]; n[idx] = { ...a, title: e.target.value }; setAchievements(n); }}
                    onBlur={() => void saveAchievement(idx)}
                    placeholder={t("publicProfileAchievementTitle")}
                    maxLength={200}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={a.year ?? ""}
                      onChange={(e) => { const n = [...achievements]; n[idx] = { ...a, year: e.target.value ? parseInt(e.target.value) : null }; setAchievements(n); }}
                      onBlur={() => void saveAchievement(idx)}
                      placeholder={t("publicProfileAchievementYear")}
                      min={1990} max={2100}
                      className="h-8 text-xs flex-1"
                    />
                    <Select value={a.medal ?? "none"} onValueChange={(v) => {
                      const medal = v === "none" ? null : v;
                      const n = [...achievements]; n[idx] = { ...a, medal }; setAchievements(n);
                      void saveAchievement(idx);
                    }}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("publicProfileMedalNone")}</SelectItem>
                        <SelectItem value="gold">🥇 {t("publicProfileMedalGold")}</SelectItem>
                        <SelectItem value="silver">🥈 {t("publicProfileMedalSilver")}</SelectItem>
                        <SelectItem value="bronze">🥉 {t("publicProfileMedalBronze")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void removeAchievement(idx)} className="h-8 w-8 p-0">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Videos editor */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1"><Video className="h-3 w-3" /> {t("publicProfileVideos")}</Label>
                <Button type="button" size="sm" variant="ghost" onClick={addVideo} disabled={videos.length >= 4} className="h-7 px-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> {t("publicProfileAddVideo")}
                </Button>
              </div>
              {videos.map((v, idx) => (
                <div key={idx} className="space-y-1.5 p-2 rounded border border-border">
                  <Input
                    value={v.url}
                    onChange={(e) => { const n = [...videos]; n[idx] = { ...v, url: e.target.value }; setVideos(n); }}
                    onBlur={() => void saveVideo(idx)}
                    placeholder={t("publicProfileVideoUrl")}
                    maxLength={500}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={v.title ?? ""}
                      onChange={(e) => { const n = [...videos]; n[idx] = { ...v, title: e.target.value }; setVideos(n); }}
                      onBlur={() => void saveVideo(idx)}
                      placeholder={t("publicProfileVideoTitle")}
                      maxLength={100}
                      className="h-8 text-xs flex-1"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => void removeVideo(idx)} className="h-8 w-8 p-0">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
