import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildClubTheme } from "@/lib/clubTheme";

interface ClubBranding {
  clubId: string | null;
  clubName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  enabled: boolean;
}

const EMPTY: ClubBranding = {
  clubId: null,
  clubName: null,
  logoUrl: null,
  primaryColor: null,
  accentColor: null,
  backgroundColor: null,
  enabled: false,
};

const ClubBrandingContext = createContext<ClubBranding>(EMPTY);

export function useClubBranding() {
  return useContext(ClubBrandingContext);
}

const VARS: Record<string, string> = {
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
  input: "--input",
};

function applyTheme(primary?: string | null, accent?: string | null, background?: string | null) {
  const root = document.documentElement;
  const tokens = buildClubTheme(primary, accent, background) as Record<string, string>;
  for (const [key, cssVar] of Object.entries(VARS)) {
    const value = tokens[key];
    if (value) root.style.setProperty(cssVar, value);
    else root.style.removeProperty(cssVar);
  }
}


/**
 * Loads the signed-in user's club branding (when the "branding" add-on is
 * active for that club) and injects the colours as CSS variables on the app
 * root, so every semantic token picks up the club colour automatically.
 */
export function ClubThemeProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<ClubBranding>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          applyTheme(null, null);
          setBranding(EMPTY);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const clubId = (profile as any)?.club_id as string | undefined;
      if (!clubId) {
        if (!cancelled) {
          applyTheme(null, null);
          setBranding(EMPTY);
        }
        return;
      }

      const [clubRes, moduleRes] = await Promise.all([
        supabase
          .from("clubs" as any)
          .select("id, name, logo_url, primary_color, accent_color")
          .eq("id", clubId)
          .maybeSingle(),
        supabase
          .from("club_module_defaults" as any)
          .select("enabled")
          .eq("club_id", clubId)
          .eq("module", "branding")
          .maybeSingle(),
      ]);

      const club = clubRes.data as any;
      // Branding is opt-in: it must be explicitly switched on for the club.
      const enabled = !!(moduleRes.data as any)?.enabled;
      if (cancelled) return;

      if (!club || !enabled) {
        applyTheme(null, null);
        setBranding(EMPTY);
        return;
      }

      applyTheme(club.primary_color, club.accent_color);
      setBranding({
        clubId: club.id,
        clubName: club.name ?? null,
        logoUrl: club.logo_url ?? null,
        primaryColor: club.primary_color ?? null,
        accentColor: club.accent_color ?? null,
        enabled: true,
      });
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(load, 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <ClubBrandingContext.Provider value={branding}>{children}</ClubBrandingContext.Provider>;
}
