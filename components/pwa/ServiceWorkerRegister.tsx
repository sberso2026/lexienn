"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/registerServiceWorker";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    void registerServiceWorker();
  }, []);

  return null;
}
