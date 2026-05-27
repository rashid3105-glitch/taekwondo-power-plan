import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Smartphone, ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SHORTCUT_ICLOUD_URL = "https://www.icloud.com/shortcuts/5ae8d26b8ddb4a10a86c1cba1406933e";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const TOKEN_URL = `${SUPABASE_URL}/functions/v1/get-health-token`;

export default function HealthSyncSetup() {
  const navigate = useNavigate();
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenUrlCopied, setTokenUrlCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Just mark as ready — user uses email/password in Shortcut now
    setReady(true);
    setTokenCopied(true);
    (async () => {
      try {
        await navigator.clipboard.writeText(TOKEN_URL);
      } catch {
        // ignore — user can tap the copy button
      }
    })();
  }, []);

  const handleInstall = () => {
    window.open(SHORTCUT_ICLOUD_URL, "_blank");
  };

  const copyTokenUrl = async () => {
    await navigator.clipboard.writeText(TOKEN_URL);
    setTokenUrlCopied(true);
    setTimeout(() => setTokenUrlCopied(false), 3000);
    toast.success("Token URL kopieret ✓");
  };

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto px-4 pb-20 flex flex-col">
      <div className="flex items-center gap-3 pt-safe py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/health")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-bold text-base">iPhone Health Sync</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Klar til installation</h2>
          <p className="text-muted-foreground text-sm px-4">
            Tryk nedenfor for at installere Shortcut'en. Den logger ind med dit email + kodeord og henter automatisk et frisk token hver gang.
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className={cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            tokenCopied ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/30"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
              tokenCopied ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              {tokenCopied ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div>
              <p className="text-sm font-semibold">Nøgle-URL kopieret</p>
              <p className="text-xs text-muted-foreground">Din Shortcut henter automatisk et frisk token</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
              2
            </div>
            <div>
              <p className="text-sm font-semibold">Installer Shortcut</p>
              <p className="text-xs text-muted-foreground">Tryk på knappen nedenfor</p>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 h-14 text-base"
          onClick={handleInstall}
          disabled={!ready}
        >
          <ExternalLink className="h-5 w-5" />
          Installer Sportstalent Health Shortcut
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={copyTokenUrl}
        >
          {tokenUrlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {tokenUrlCopied ? "URL kopieret" : "Kopier nøgle-URL igen"}
        </Button>

        <Card className="w-full p-4 bg-muted/30 border-border">
          <p className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wide">Sådan virker det</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex gap-2"><span>1.</span><span>Shortcut'en logger ind med dit email + kodeord</span></div>
            <div className="flex gap-2"><span>2.</span><span>Henter automatisk et frisk token hver gang</span></div>
            <div className="flex gap-2"><span>3.</span><span>Synker dine sundhedsdata til Sportstalent</span></div>
            <div className="flex gap-2"><span>✓</span><span className="text-emerald-600 font-medium">Virker for evigt — ingen udløbsdato</span></div>
          </div>
        </Card>

        <Card className="w-full p-4">
          <p className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wide">Hvad synkes</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "👟", label: "Skridt" },
              { icon: "💤", label: "Hvilepuls" },
              { icon: "📈", label: "HRV" },
              { icon: "🌙", label: "Søvn" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span>{item.icon}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
