import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMySportProfile } from "@/hooks/useMySportProfile";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Loader2, Medal, ListOrdered, UserSearch } from "lucide-react";

// TaekwondoData nation code (ISO numeric) → ISO alpha-2
const NATIONS: [string, string][] = [
  ["032","AR"],["036","AU"],["040","AT"],["031","AZ"],["056","BE"],["076","BR"],["100","BG"],["124","CA"],["152","CL"],["156","CN"],["170","CO"],["191","HR"],["196","CY"],["203","CZ"],["208","DK"],["818","EG"],["233","EE"],["246","FI"],["250","FR"],["268","GE"],["276","DE"],["300","GR"],["348","HU"],["352","IS"],["356","IN"],["364","IR"],["368","IQ"],["372","IE"],["376","IL"],["380","IT"],["384","CI"],["392","JP"],["400","JO"],["398","KZ"],["410","KR"],["414","KW"],["428","LV"],["422","LB"],["440","LT"],["484","MX"],["504","MA"],["528","NL"],["554","NZ"],["566","NG"],["578","NO"],["586","PK"],["275","PS"],["616","PL"],["620","PT"],["634","QA"],["642","RO"],["643","RU"],["682","SA"],["688","RS"],["703","SK"],["705","SI"],["710","ZA"],["724","ES"],["752","SE"],["756","CH"],["760","SY"],["158","TW"],["764","TH"],["788","TN"],["792","TR"],["804","UA"],["784","AE"],["826","GB"],["840","US"],["860","UZ"],["704","VN"],
];
const flag = (a2: string) => String.fromCodePoint(...[...a2].map((c) => 127397 + c.charCodeAt(0)));

interface Fighter { name: string; role: string; country: string | null; profileUrl: string; }

export default function FighterSearch() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { profile: sport, loading: sportLoading } = useMySportProfile();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [nation, setNation] = useState("ALLNATIONS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Fighter[] | null>(null);

  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([locale], { type: "region" }); } catch { /* ignore */ }
  const nations = NATIONS.map(([code, a2]) => ({ code, a2, label: names?.of(a2) ?? a2 }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if ((first + last).trim().length < 2) { setError(t("fsNameRequired")); return; }
    setLoading(true); setError(null); setResults(null);
    const { data, error: err } = await supabase.functions.invoke("fighter-search", { body: { sport: sport.slug, firstname: first, surname: last, nation } });
    setLoading(false);
    if (err || data?.error) { setError(t("fsError")); return; }
    setResults(data.results ?? []);
  }

  const resultsUrl = (name: string) => {
    const [l, f] = name.split(",").map((s) => s.trim());
    return `https://www.google.com/search?q=${encodeURIComponent(`"${f ?? ""} ${l}" taekwondo results`)}`;
  };
  const displayName = (n: string) => { const [l, f] = n.split(",").map((s) => s.trim()); return f ? `${f} ${l}` : n; };

  if (!sportLoading && sport.slug !== "taekwondo") return <Navigate to="/coach/competitions" replace />;
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 pt-safe">
        <div className="container max-w-3xl mx-auto px-3 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t("back")} title={t("back")}><ArrowLeft className="h-4 w-4" /></Button>
          <UserSearch className="h-5 w-5 text-primary" />
          <span className="font-bold flex-1 truncate">{t("fsTitle")}</span>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-3 py-5 space-y-5">
        <Card className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{t("fsHint")}</p>
          <form onSubmit={search} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="fs-first">{t("fsFirst")}</Label>
              <Input id="fs-first" value={first} maxLength={60} onChange={(e) => setFirst(e.target.value)} className="h-11" autoComplete="off" /></div>
            <div className="space-y-1.5"><Label htmlFor="fs-last">{t("fsLast")}</Label>
              <Input id="fs-last" value={last} maxLength={60} onChange={(e) => setLast(e.target.value)} className="h-11" autoComplete="off" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("fsCountry")}</Label>
              <Select value={nation} onValueChange={setNation}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="ALLNATIONS">{t("fsAnyCountry")}</SelectItem>
                  {nations.map((n) => <SelectItem key={n.code} value={n.code}>{flag(n.a2)} {n.label}</SelectItem>)}
                </SelectContent>
              </Select></div>
            <Button type="submit" className="h-11 sm:col-span-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}{t("fsSearch")}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>

        {results && results.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">{t("fsNone")}</p>}

        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r) => (
              <Card key={r.profileUrl} className="p-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="font-semibold leading-tight break-words">{displayName(r.name)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1 text-xs text-muted-foreground items-center">
                      {r.country && <Badge variant="secondary">{r.country}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" className="min-h-11 h-auto whitespace-normal py-2">
                      <a href={r.profileUrl} target="_blank" rel="noopener noreferrer"><Medal className="h-4 w-4 mr-1.5" />{t("fsProfile")}</a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="min-h-11 h-auto whitespace-normal py-2">
                      <a href={resultsUrl(r.name)} target="_blank" rel="noopener noreferrer"><ListOrdered className="h-4 w-4 mr-1.5" />{t("fsResults")}</a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-center text-muted-foreground">{t("fsSource")}</p>
      </main>
    </div>
  );
}
