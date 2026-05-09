import { useState, useEffect } from "react";
import { X } from "lucide-react";

const KEY = "invite_welcome_banner";

export function InviteWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setVisible(true);
    } catch {}
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.removeItem(KEY); } catch {}
    setVisible(false);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/15 flex-shrink-0">Nyt</span>
      <p className="text-sm text-foreground flex-1">Din træner har klargjort din første plan 👊</p>
      <button onClick={dismiss} aria-label="Luk" className="text-muted-foreground hover:text-foreground flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
