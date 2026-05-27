import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ← Replace this with your real iCloud Shortcut link after creating it in the Shortcuts app
const SHORTCUT_ICLOUD_URL = "https://www.icloud.com/shortcuts/5ae8d26b8ddb4a10a86c1cba1406933e";

export default function HealthSyncSetup() {
  const navigate = useNavigate();
  const [tokenCopied, setTokenCopied] = useState(false);
  const [ready, setReady] = useState(false);

  // Auto-copy token when page loads
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        await navigator.clipboard.writeText(session.access_token);
        setTokenCopied(true);
        setReady(true);
      } catch {
        // Clipboard failed (permissions) — still show the install button
        setReady(true);
      }
    })();
  }, []);

  const handleInstall = () => {
    window.open(SHORTCUT_ICLOUD_URL, "_blank");
  };

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto px-4 pb-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pt-safe py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/health")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-bold text-base">iPhone Health Sync</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        {/* Icon */}
        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">
            {tokenCopied ? "Nøgle kopieret ✓" : "Gør klar…"}
          </h2>
          <p className="text-muted-foreground text-sm px-4">
            {tokenCopied
              ? "Din personlige sync-nøgle er kopieret. Tryk nedenfor for at installere Shortcut'en — den bruger nøglen automatisk."
              : "Henter din sync-nøgle…"}
          </p>
        </div>

        {/* Step indicators */}
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
              <p className="text-sm font-semibold">Sync-nøgle kopieret</p>
              <p className="text-xs text-muted-foreground">Sker automatisk</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            "border-border bg-muted/30"
          )}>
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
              2
            </div>
            <div>
              <p className="text-sm font-semibold">Installer Shortcut</p>
              <p className="text-xs text-muted-foreground">Tryk på knappen nedenfor</p>
            </div>
          </div>
        </div>

        {/* Install button */}
        <Button
          size="lg"
          className="w-full gap-2 h-14 text-base"
          onClick={handleInstall}
          disabled={!ready}
        >
          <ExternalLink className="h-5 w-5" />
          Installer Sportstalent Health Shortcut
        </Button>

        <p className="text-xs text-muted-foreground text-center px-4">
          Shortcut'en åbner i appen Genveje. Tryk "Tilføj genvej", kør den og indsæt din nøgle første gang.
        </p>

        {/* What gets synced */}
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
