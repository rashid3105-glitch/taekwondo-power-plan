import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function AppUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Lyt efter besked fra ny service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        setShowBanner(true);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    let intervalId: ReturnType<typeof setInterval> | undefined;

    // Tjek om der er en ventende opdatering
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setShowBanner(true);
          }
        });
      });
      // Tjek med det samme om der allerede er en waiting worker
      if (reg.waiting && navigator.serviceWorker.controller) {
        setShowBanner(true);
      }
      // Poll for updates every 5 minutes
      intervalId = setInterval(() => reg.update(), 5 * 60 * 1000);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (!showBanner) return null;

  const handleUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });
    window.location.reload();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#F5C842",
        color: "#0B0C14",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
      onClick={handleUpdate}
    >
      <RefreshCw size={15} />
      Ny version tilgængelig — Opdater nu
    </div>
  );
}
