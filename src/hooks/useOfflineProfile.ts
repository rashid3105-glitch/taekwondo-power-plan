// React hook providing offline-cached read access to the user's profile row.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedProfile, setCachedProfile } from "@/lib/profileOfflineDB";

export function useOfflineProfile() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!error && data) {
        setProfile(data);
        setIsFromCache(false);
        setCachedAt(Date.now());
        await setCachedProfile(user.id, data);
        setLoading(false);
        return;
      }
    }

    const cached = await getCachedProfile(user.id);
    if (cached) {
      setProfile(cached.profile);
      setIsFromCache(true);
      setCachedAt(cached.saved_at);
    } else {
      setProfile(null);
      setIsFromCache(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUp = () => { setOnline(true); void refresh(); };
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, [refresh]);

  return { profile, loading, online, isFromCache, cachedAt };
}
