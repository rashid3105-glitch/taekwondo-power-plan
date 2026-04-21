import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin, Loader2, Share2, ArrowRight, User, Award } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { AppFooter } from "@/components/AppFooter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface ProfileData {
  display_name: string;
  athlete_code: string;
  belt_level: string;
  discipline: string;
  country: string | null;
  avatar_url: string | null;
  club_name: string | null;
}
interface Achievement { id: string; title: string; year: number | null; medal: string | null; }
interface Video { id: string; url: string; title: string | null; }
interface Competition { id: string; name: string; event_date: string; weight_class_kg: number | null; location: string | null; result: string | null; }
interface PR { test_name: string; value: number; unit: string; category: string; test_date: string; }

interface Bundle {
  profile: ProfileData;
  achievements: Achievement[];
  videos: Video[];
  competitions: Competition[];
  personal_records: PR[];
}

const MEDAL_EMOJI: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* ignore */ }
  return null;
}

export default function PublicAthlete() {
  const { code } = useParams<{ code: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [code]);

  async function load() {
    if (!code) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_public_athlete_bundle", { _code: code });
    if (error || !data) {
      setBundle(null);
      setLoading(false);
      return;
    }
    const b = data as unknown as Bundle;
    setBundle(b);

    // fetch avatar via edge function (signed URL)
    if (b?.profile?.avatar_url) {
      try {
        const { data: avatarData } = await supabase.functions.invoke("get-public-avatar", {
          body: { code },
          method: "GET",
        });
        // Fall back to GET with query string
        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-avatar?code=${encodeURIComponent(code)}`;
        const res = await fetch(fnUrl, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        if (res.ok) {
          const json = await res.json();
          setAvatarUrl(json.url || (avatarData as any)?.url || null);
        }
      } catch { /* ignore */ }
    }
    setLoading(false);
  }

  async function share() {
    const url = window.location.href;
    const title = bundle?.profile?.display_name ? `${bundle.profile.display_name} · Sportstalent` : "Sportstalent";
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("publicProfileCopied") });
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!bundle || !bundle.profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageMeta
          title={t("publicProfilePrivate")}
          description={t("publicProfilePrivateDesc")}
          noindex
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{t("publicProfilePrivate")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("publicProfilePrivateDesc")}</p>
              </div>
              <Button asChild><Link to="/">{t("publicProfileBackHome")}</Link></Button>
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    );
  }

  const { profile, achievements, videos, competitions, personal_records } = bundle;
  const title = `${profile.display_name} · ${t("publicProfileTitle")}`;
  const description = `${profile.display_name} — ${profile.belt_level} belt · ${profile.discipline}${profile.club_name ? ` · ${profile.club_name}` : ""}`;
  const canonical = `https://sportstalent.dk/athlete/${profile.athlete_code}`;

  // JSON-LD Person schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.display_name,
    "nationality": profile.country || undefined,
    "memberOf": profile.club_name ? { "@type": "SportsOrganization", "name": profile.club_name } : undefined,
    "knowsAbout": "Taekwondo",
    "url": canonical,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta title={title} description={description} canonical={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-primary/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight uppercase">{profile.display_name}</h1>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="capitalize">{profile.belt_level} belt</Badge>
                  <Badge variant="secondary" className="capitalize">{profile.discipline}</Badge>
                  {profile.country && <Badge variant="outline">{profile.country}</Badge>}
                </div>
                {profile.club_name && (
                  <p className="text-sm text-muted-foreground mt-1.5">{profile.club_name}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={share}>
                    <Share2 className="h-3.5 w-3.5 mr-1" /> {t("publicProfileShare")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements + PRs */}
        {(achievements.length > 0 || personal_records.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-primary">
                    <Trophy className="h-4 w-4" /> {t("publicProfileAchievements")}
                  </h2>
                  <ul className="space-y-1.5 text-sm">
                    {achievements.map((a) => (
                      <li key={a.id} className="flex items-start gap-2">
                        <span className="text-base leading-tight">{a.medal && MEDAL_EMOJI[a.medal] ? MEDAL_EMOJI[a.medal] : "•"}</span>
                        <span className="flex-1">
                          {a.title}
                          {a.year && <span className="text-muted-foreground"> · {a.year}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {personal_records.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-primary">
                    <Award className="h-4 w-4" /> {t("publicProfilePersonalRecords")}
                  </h2>
                  <ul className="space-y-1.5 text-sm">
                    {personal_records.map((pr, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="capitalize text-muted-foreground">{pr.test_name}</span>
                        <span className="font-semibold tabular-nums">{pr.value} {pr.unit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Highlight reel */}
        {videos.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-primary">
                <Trophy className="h-4 w-4" /> {t("publicProfileHighlightReel")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {videos.map((v) => {
                  const embed = getEmbedUrl(v.url);
                  if (!embed) return null;
                  return (
                    <div key={v.id} className="space-y-1">
                      <div className="aspect-video rounded-md overflow-hidden bg-muted">
                        <iframe
                          src={embed}
                          title={v.title || "Highlight"}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      {v.title && <p className="text-xs text-muted-foreground">{v.title}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitions */}
        {competitions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-primary">
                <Calendar className="h-4 w-4" /> {t("publicProfileCompetitions")}
              </h2>
              <ul className="space-y-2 text-sm">
                {competitions.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="font-medium flex-1 min-w-0">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.event_date).toLocaleDateString()}</span>
                    {c.weight_class_kg && <Badge variant="outline" className="text-[10px]">-{c.weight_class_kg}kg</Badge>}
                    {c.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </span>
                    )}
                    {c.result && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30" variant="outline">{c.result}</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("publicProfilePoweredBy")}</p>
              <p className="font-semibold mt-0.5">Sportstalent — taekwondo strength &amp; conditioning</p>
            </div>
            <Button asChild>
              <Link to="/">{t("publicProfileCTA")} <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  );
}
