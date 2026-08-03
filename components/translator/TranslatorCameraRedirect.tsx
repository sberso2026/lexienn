"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy Translate camera deep-links redirect to Lens.
 * Handles: ?mode=camera, ?tab=camera, #camera
 */
export function TranslatorCameraRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode")?.toLowerCase();
    const tab = searchParams.get("tab")?.toLowerCase();
    const hash =
      typeof window !== "undefined" ? window.location.hash.toLowerCase() : "";

    const wantsCamera =
      mode === "camera" || tab === "camera" || hash === "#camera";

    if (wantsCamera) {
      router.replace("/lens");
    }
  }, [router, searchParams]);

  return null;
}
