import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

// ---------------------------------------------------------------------------
// LicenseGate — UX GATE ONLY, NOT A SECURITY BOUNDARY.
//
// This component hides the product UI from users whose club has no active
// licence. It runs entirely in the browser and can be bypassed by anyone with
// developer tools. It protects NO data. Real enforcement would require RLS
// policies on the server. Do not rely on this component for access control.
//
// Fail-open by design: any error, network failure or RLS rejection results in
// ACCESS, never a block. Platform admins and users without a club_id are never
// blocked.
// ---------------------------------------------------------------------------

// Client kill-switch. Default OFF — the gate ships inert until
// VITE_LICENSE_GATE_ENABLED="true" is set in the environment.
const GATE_ENABLED = import.meta.env.VITE_LICENSE_GATE_ENABLED === "true";

const PUBLIC_PREFIXES = [
  "/auth", "/reset-password", "/consent/", "/privacy", "/unsubscribe",
  "/parent-join/", "/join/", "/invite/", "/signup",
  "/features/", "/platform/", "/match/share/", "/athlete/",
];
const PUBLIC_EXACT = new Set([
  "/", "/v1", "/v2", "/pricing", "/priser", "/about", "/contact",
  "/methodology", "/programs", "/signup/coach", "/traeningsprogram",
  "/tekniktraening", "/staevneforberedelse", "/fysiske-test", "/poomsae",
  "/payment-success",
]);

const onPublic = (pathname: string) =>
  PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "blocked"; canBuy: boolean; clubName: string | null };

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ kind: "loading" });

  const evaluate = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setState({ kind: "ok" }); return; }
      const uid = session.user.id;

      // (b) Platform admin is never blocked.
      const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin", { _user_id: uid });
      if (adminErr) { setState({ kind: "ok" }); return; } // fail open
      if (isAdmin === true) { setState({ kind: "ok" }); return; }

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", uid)
        .maybeSingle();
      if (profErr) { setState({ kind: "ok" }); return; } // (f) fail open

      const clubId = (profile as any)?.club_id as string | null | undefined;
      // (c) No club → never blocked.
      if (!clubId) { setState({ kind: "ok" }); return; }

      const { data: club, error: clubErr } = await supabase
        .from("clubs" as any)
        .select("name, license_active")
        .eq("id", clubId)
        .maybeSingle();
      if (clubErr || !club) { setState({ kind: "ok" }); return; } // (f) fail open

      // (d) Licensed → through.
      if ((club as any).license_active === true) { setState({ kind: "ok" }); return; }

      // (e) Unlicensed — coaches/club admins get a buy path, everyone else does not.
      const { data: memberships, error: memErr } = await supabase
        .from("club_memberships" as any)
        .select("role_in_club")
        .eq("user_id", uid)
        .eq("club_id", clubId)
        .eq("status", "active");
      if (memErr) { setState({ kind: "ok" }); return; } // fail open

      const canBuy = ((memberships as any[]) ?? []).some(
        (m) => m.role_in_club === "coach" || m.role_in_club === "admin",
      );

      setState({ kind: "blocked", canBuy, clubName: ((club as any).name as string) ?? null });
    } catch {
      // (f) Any unexpected failure → access, never a block.
      setState({ kind: "ok" });
    }
  }, []);

  useEffect(() => {
    if (!GATE_ENABLED) return;
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { evaluate(); });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  // Kill-switch off → completely inert.
  if (!GATE_ENABLED) return <>{children}</>;

  // (a) Public routes and /priser are never gated.
  if (onPublic(location.pathname)) return <>{children}</>;

  if (state.kind === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state.kind === "ok") return <>{children}</>;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6 space-y-4 text-center">
        <div className="flex justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">
          {state.canBuy ? t("licenseGateCoachTitle") : t("licenseGateMemberTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.canBuy ? t("licenseGateCoachBody") : t("licenseGateMemberBody")}
        </p>
        {state.clubName && (
          <p className="text-xs text-muted-foreground">{state.clubName}</p>
        )}
        <div className="flex flex-col gap-2 pt-2">
          {state.canBuy && (
            <Button onClick={() => navigate("/priser")}>{t("licenseGateSeePricing")}</Button>
          )}
          <Button variant="outline" onClick={signOut}>{t("licenseGateSignOut")}</Button>
        </div>
      </Card>
    </div>
  );
}
