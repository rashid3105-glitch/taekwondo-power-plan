import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClubTrial {
  isInTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  loading: boolean;
}

export function useClubTrial(clubId: string | null | undefined): ClubTrial {
  const [state, setState] = useState<ClubTrial>({
    isInTrial: false,
    trialDaysLeft: 0,
    trialExpired: false,
    loading: true,
  });

  useEffect(() => {
    if (!clubId) {
      setState({ isInTrial: false, trialDaysLeft: 0, trialExpired: false, loading: false });
      return;
    }
    supabase
      .from("clubs" as any)
      .select("created_at, license_active")
      .eq("id", clubId)
      .single()
      .then(({ data }) => {
        if (!data) {
          setState({ isInTrial: false, trialDaysLeft: 0, trialExpired: false, loading: false });
          return;
        }
        // Paying clubs (license_active) are never in trial and never expired.
        if ((data as any).license_active) {
          setState({ isInTrial: false, trialDaysLeft: 0, trialExpired: false, loading: false });
          return;
        }
        const created = new Date((data as any).created_at);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 14 - daysSince);
        const isInTrial = daysLeft > 0;
        setState({
          isInTrial,
          trialDaysLeft: daysLeft,
          trialExpired: !isInTrial,
          loading: false,
        });
      });
  }, [clubId]);

  return state;
}
