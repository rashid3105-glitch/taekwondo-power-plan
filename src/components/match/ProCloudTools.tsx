import { createContext, useContext, useEffect, useRef, useState, type RefObject } from "react";
import { Pencil, Undo2, Share2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMatchLabT } from "@/i18n/matchLab";

/** Set when the analyzer runs against saved (online) matches. */
export const ProCloudCtx = createContext<{ me: string; canEdit: boolean } | null>(null);
export const useProCloud = () => useContext(ProCloudCtx);

type Pt = { x: number; y: number };
interface Ann { id: string; t: number; paths: { points: Pt[]; color: string; norm?: boolean }[] }
const SHOW_WINDOW = 2; // seconds a drawing stays visible around its moment

export function DrawLayer({ videoId, videoRef, time }: { videoId: string; videoRef: RefObject<HTMLVideoElement>; time: number }) {
  const t = useMatchLabT();
  const cloud = useProCloud();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [mode, setMode] = useState(false);
  const [cur, setCur] = useState<Pt[] | null>(null);
  const [mine, setMine] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from as any)("video_annotations").select("id, timestamp_seconds, paths").eq("video_id", videoId);
      setAnns((data ?? []).map((r: any) => ({ id: r.id, t: Number(r.timestamp_seconds), paths: r.paths ?? [] })));
    })();
  }, [videoId]);

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio;
    const g = c.getContext("2d")!; g.clearRect(0, 0, c.width, c.height);
    g.lineWidth = 3 * devicePixelRatio; g.lineCap = "round"; g.lineJoin = "round";
    const draw = (pts: Pt[], color: string, norm = true) => {
      if (pts.length < 2) return;
      g.strokeStyle = color; g.beginPath();
      pts.forEach((p, i) => { const x = norm ? p.x * c.width : (p.x / 800) * c.width; const y = norm ? p.y * c.height : (p.y / 450) * c.height; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    };
    anns.filter((a) => Math.abs(a.t - time) <= SHOW_WINDOW).forEach((a) => a.paths.forEach((p) => draw(p.points, p.color, !!p.norm)));
    if (cur) draw(cur, "#facc15");
  }, [anns, time, cur]);

  const pt = (e: React.PointerEvent): Pt => { const r = canvas.current!.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  const end = async () => {
    if (!cur || cur.length < 2 || !cloud) { setCur(null); return; }
    const ts = Math.round((videoRef.current?.currentTime ?? time) * 10) / 10;
    const paths = [{ points: cur, color: "#facc15", norm: true }];
    setCur(null);
    const { data, error } = await (supabase.from as any)("video_annotations").insert({ video_id: videoId, created_by: cloud.me, timestamp_seconds: ts, paths, color: "#facc15" }).select("id").single();
    if (error || !data) { toast.error(t("saveFailed")); return; }
    setAnns((a) => [...a, { id: data.id, t: ts, paths }]); setMine((m) => [...m, data.id]);
  };
  const undo = async () => {
    const id = mine[mine.length - 1]; if (!id) return;
    const { error } = await (supabase.from as any)("video_annotations").delete().eq("id", id);
    if (error) { toast.error(t("saveFailed")); return; }
    setMine((m) => m.slice(0, -1)); setAnns((a) => a.filter((x) => x.id !== id));
  };

  return (
    <>
      <canvas ref={canvas} className={`absolute inset-0 w-full h-full ${mode ? "cursor-crosshair touch-none" : "pointer-events-none"}`}
        onPointerDown={(e) => { if (!mode) return; videoRef.current?.pause(); (e.target as Element).setPointerCapture(e.pointerId); setCur([pt(e)]); }}
        onPointerMove={(e) => { if (cur) setCur((c) => [...(c ?? []), pt(e)]); }}
        onPointerUp={end} onPointerCancel={end} />
      {cloud?.canEdit && (
        <div className="absolute top-2 end-2 flex gap-1">
          <Button size="icon" variant={mode ? "default" : "secondary"} className="h-9 w-9" title={t("draw")} aria-label={t("draw")} onClick={() => setMode((m) => !m)}><Pencil className="h-4 w-4" /></Button>
          {mine.length > 0 && <Button size="icon" variant="secondary" className="h-9 w-9" title={t("undoDraw")} aria-label={t("undoDraw")} onClick={undo}><Undo2 className="h-4 w-4" /></Button>}
        </div>
      )}
    </>
  );
}

export function ShareButton({ videoId }: { videoId: string }) {
  const t = useMatchLabT();
  const cloud = useProCloud();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from("match_videos").select("share_token, share_expires_at").eq("id", videoId).maybeSingle().then(({ data }) => {
      if (data?.share_token && data.share_expires_at && new Date(data.share_expires_at) > new Date()) setToken(data.share_token);
    });
  }, [videoId]);
  if (!cloud?.canEdit) return null;
  const call = async (action: "create" | "revoke") => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("share-match-video", { body: { video_id: videoId, action } });
      if (error || (data as any)?.error) throw new Error();
      const tok = (data as any).share_token ?? null;
      setToken(tok);
      if (tok) {
        const url = `${window.location.origin}/match/share/${tok}`;
        try { await navigator.clipboard.writeText(url); toast.success(t("shareCopied")); } catch { toast.success(url); }
      } else toast.success(t("shareRevoked"));
    } catch { toast.error(t("saveFailed")); } finally { setBusy(false); }
  };
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="h-11" disabled={busy} onClick={() => call("create")}><Share2 className="h-4 w-4 me-1" />{token ? t("shareCopy") : t("share")}</Button>
      {token && <Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} title={t("shareRevoke")} aria-label={t("shareRevoke")} onClick={() => call("revoke")}><Link2Off className="h-4 w-4" /></Button>}
    </div>
  );
}
