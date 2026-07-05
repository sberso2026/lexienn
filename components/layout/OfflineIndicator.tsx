"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="border-b border-amber-300 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      Offline — packs still work
    </div>
  );
}
