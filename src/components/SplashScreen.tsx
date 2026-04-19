import logo from "@/assets/logo.webp";
import { Loader2 } from "lucide-react";

export const SplashScreen = ({ message }: { message?: string }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6">
    <img
      src={logo}
      alt="Sportstalent"
      className="h-20 w-20 animate-pulse rounded-2xl"
    />
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message ?? "Loading…"}</span>
    </div>
  </div>
);
