import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Admin-only toggle: when ON, this admin user gets read access to ALL clubs
 * (season calendar, plans, diaries, etc.) through the `is_superadmin()` RLS
 * bypass. The club switcher also lists every club. Writes are NOT affected.
 *
 * Persisted in `profiles.superadmin_active` via the `set_superadmin_active` RPC.
 * Flipping it triggers a full reload so ActiveClubContext rebuilds the club list.
 */
export function SuperadminToggle() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("superadmin_active" as any)
        .eq("user_id", user.id)
        .maybeSingle();
      setActive(Boolean((data as any)?.superadmin_active));
      setLoading(false);
    })();
  }, []);

  const onToggle = async (next: boolean) => {
    setSaving(true);
    const { error } = await supabase.rpc("set_superadmin_active" as any, { _active: next });
    setSaving(false);
    if (error) {
      toast({ title: "Kunne ikke ændre", description: error.message, variant: "destructive" });
      return;
    }
    setActive(next);
    toast({
      title: next ? "Superadmin slået TIL" : "Superadmin slået FRA",
      description: next
        ? "Du har nu læseadgang til alle klubber. Klubvælgeren genindlæses."
        : "Du ser igen kun dine egne klubber.",
    });
    // Reload so ActiveClubContext rebuilds the membership list.
    setTimeout(() => window.location.reload(), 600);
  };

  if (loading) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        active
          ? "border-destructive/60 bg-destructive/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ShieldAlert
          className={`h-5 w-5 shrink-0 ${active ? "text-destructive" : "text-muted-foreground"}`}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Superadmin {active ? "(aktiv)" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Når slået til får du læseadgang til alle klubbers data og kan vælge
            enhver klub i klubvælgeren. Skriverettigheder ændres ikke.
          </p>
        </div>
      </div>
      <Switch checked={active} disabled={saving} onCheckedChange={onToggle} />
    </div>
  );
}
