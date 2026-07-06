"use client";

import { useEffect, useState } from "react";
import { CompactCard } from "@/components/ui/CompactCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { getDisplayMode, isAndroid, isIOS, isMobileDevice, isSafariIOS, isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

export function PwaDiagnosticsPanel() {
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        setServiceWorkerActive(Boolean(registration?.active));
      });
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPromptAvailable(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const rows = [
    { label: "isStandalone", value: String(isStandaloneApp()) },
    { label: "isMobile", value: String(isMobileDevice()) },
    { label: "isIOS", value: String(isIOS()) },
    { label: "isSafari", value: String(isSafariIOS()) },
    { label: "isAndroid", value: String(isAndroid()) },
    { label: "displayMode", value: getDisplayMode() },
    { label: "manifest", value: "/manifest.webmanifest" },
    { label: "serviceWorker", value: serviceWorkerActive ? "registered" : "not registered" },
    { label: "installPrompt", value: installPromptAvailable ? "available" : "unavailable" },
    { label: "appleTouchIcon", value: "/apple-touch-icon.png" },
  ];

  return (
    <CompactCard>
      <h3 className="mb-2 text-sm font-semibold">PWA diagnostics</h3>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((row) => (
          <StatusChip key={row.label} label={`${row.label}: ${row.value}`} variant="neutral" />
        ))}
      </div>
    </CompactCard>
  );
}
