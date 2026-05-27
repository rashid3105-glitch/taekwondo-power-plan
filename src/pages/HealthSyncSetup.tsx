import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Check,
  Smartphone,
  ExternalLink,
  Copy,
  AlertTriangle,
  Zap,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SHORTCUT_ICLOUD_URL =
  "https://www.icloud.com/shortcuts/5ae8d26b8ddb4a10a86c1cba1406933e";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const TOKEN_URL = `${SUPABASE_URL}/functions/v1/get-health-token`;
const SYNC_URL = `${SUPABASE_URL}/functions/v1/sync-health-data`;

type CopyKey = "token" | "sync" | "apikey";

export default function HealthSyncSetup() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<Record<CopyKey, boolean>>({
    token: false,
    sync: false,
    apikey: false,
  });
  const [userEmail, setUserEmail] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testPassword, setTestPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { ok: true }
    | { ok: false; message: string }
    | null
  >(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const handleInstall = () => {
    window.open(SHORTCUT_ICLOUD_URL, "_blank");
  };

  const copy = async (key: CopyKey, value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied((c) => ({ ...c, [key]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [key]: false })), 2500);
    toast.success(`${label} kopieret ✓`);
  };

  const runTest = async () => {
    if (!userEmail || !testPassword) {
      toast.error("Indtast dit kodeord");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email: userEmail, password: testPassword }),
      });
      if (res.status === 200) {
        setTestResult({ ok: true });
        setTestPassword("");
      } else if (res.status === 401) {
        setTestResult({ ok: false, message: "Forkert kodeord" });
      } else {
        const text = await res.text().catch(() => "");
        setTestResult({
          ok: false,
          message: `Fejl ${res.status}: ${text.slice(0, 120) || "ukendt fejl"}`,
        });
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: `Netværksfejl: ${String(e?.message || e)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto px-4 pb-20 flex flex-col">
      <div className="flex items-center gap-3 pt-safe py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/health")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-bold text-base">iPhone Health Sync</h1>
      </div>

      <div className="flex-1 flex flex-col items-center gap-6 py-6">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
          <Smartphone className="h-10 w-10 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Sundheds-sync</h2>
          <p className="text-muted-foreground text-sm px-2">
            Shortcut'en logger ind med dit email + kodeord og henter automatisk
            et frisk token hver gang den synker.
          </p>
        </div>

        {/* WARNING about Safari error */}
        <Card className="w-full p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Ser du "You do not have access to this project"?
              </p>
              <p className="text-xs text-muted-foreground">
                Den besked kommer fra Safari + Supabase-dashboardet — ikke fra
                Sportstalent. Det betyder Shortcut'en har en gammel "Åbn
                URL"-action der skal slettes. Følg tjeklisten nedenfor.
              </p>
            </div>
          </div>
        </Card>

        {/* Install button */}
        <Button
          size="lg"
          className="w-full gap-2 h-14 text-base"
          onClick={handleInstall}
        >
          <ExternalLink className="h-5 w-5" />
          Installer Sportstalent Health Shortcut
        </Button>

        {/* Test connection */}
        <Card className="w-full p-4">
          <div className="flex items-start gap-3 mb-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Test forbindelse</p>
              <p className="text-xs text-muted-foreground">
                Verificer at email + kodeord virker mod sync-endpointet, før
                du kører hele Shortcut'en.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setTestResult(null);
              setTestOpen(true);
            }}
            disabled={!userEmail}
          >
            Kør test ({userEmail || "loader..."})
          </Button>
          {testResult?.ok && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              Forbindelse OK — Shortcut'en kan hente tokens
            </div>
          )}
          {testResult && !testResult.ok && (
            <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}
        </Card>

        {/* Copy buttons */}
        <Card className="w-full p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Værdier til Shortcut'en
          </p>

          <CopyRow
            label="Token URL (Trin 1)"
            value={TOKEN_URL}
            copied={copied.token}
            onCopy={() => copy("token", TOKEN_URL, "Token URL")}
          />
          <CopyRow
            label="Sync URL (Trin 2)"
            value={SYNC_URL}
            copied={copied.sync}
            onCopy={() => copy("sync", SYNC_URL, "Sync URL")}
          />
          <CopyRow
            label="API nøgle (apikey header)"
            value={ANON_KEY}
            copied={copied.apikey}
            onCopy={() => copy("apikey", ANON_KEY, "API nøgle")}
            mask
          />
        </Card>

        {/* Checklist */}
        <Card className="w-full p-2">
          <Accordion type="single" collapsible defaultValue="checklist">
            <AccordionItem value="checklist" className="border-0">
              <AccordionTrigger className="px-2 py-2 text-sm font-semibold">
                Tjekliste: sådan skal Shortcut'en være sat op
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <div className="space-y-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      1. Slet evt. "Åbn URL"-action mod supabase.com
                    </p>
                    <p>
                      Den er årsagen til dashboard-fejlen. Shortcut'en må kun
                      lave POST-kald, aldrig åbne en supabase.com URL i
                      Safari.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      2. Action: "Hent indhold fra URL" → token
                    </p>
                    <ul className="space-y-0.5 ml-4 list-disc">
                      <li>Method: POST</li>
                      <li>URL: Token URL (ovenfor)</li>
                      <li>
                        Headers: <code>Content-Type: application/json</code>,{" "}
                        <code>apikey: &lt;API nøgle&gt;</code>
                      </li>
                      <li>
                        Body (JSON):{" "}
                        <code>
                          {"{"} "email": "din email", "password": "dit kodeord"{" "}
                          {"}"}
                        </code>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      3. Action: "Hent ordbogsværdi" → <code>token</code>
                    </p>
                    <p>Træk feltet "token" ud af forrige JSON-svar.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      4. Action: "Hent indhold fra URL" → sync
                    </p>
                    <ul className="space-y-0.5 ml-4 list-disc">
                      <li>Method: POST</li>
                      <li>URL: Sync URL (ovenfor)</li>
                      <li>
                        Headers: <code>Content-Type: application/json</code>,{" "}
                        <code>
                          Authorization: Bearer &lt;token fra trin 3&gt;
                        </code>
                        , <code>apikey: &lt;API nøgle&gt;</code>
                      </li>
                      <li>
                        Body: <code>{"{ \"records\": [ ...HealthKit ] }"}</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card className="w-full p-4">
          <p className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wide">
            Hvad synkes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "👟", label: "Skridt" },
              { icon: "💤", label: "Hvilepuls" },
              { icon: "📈", label: "HRV" },
              { icon: "🌙", label: "Søvn" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span>{item.icon}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Test forbindelse</DialogTitle>
            <DialogDescription>
              Indtast dit kodeord. Det bruges kun til ét testkald og gemmes
              ikke.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input value={userEmail} disabled className="h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kodeord</Label>
              <Input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTestOpen(false)}
              disabled={testing}
            >
              Annuller
            </Button>
            <Button onClick={runTest} disabled={testing || !testPassword}>
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
  mask,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mask?: boolean;
}) {
  const display = mask ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <code
          className={cn(
            "flex-1 text-[11px] bg-muted/50 rounded px-2 py-2 break-all leading-tight",
            mask && "font-mono"
          )}
        >
          {display}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
