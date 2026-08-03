"use client";

import { isLocalOcrAvailable } from "@/lib/ocr/localOcrClient";
import { isBrowserOnline } from "@/lib/ocr/ocrClient";
import { CompactCard } from "@/components/ui/CompactCard";

export function LensCapabilityStatus() {
  const online = typeof window === "undefined" ? true : isBrowserOnline();
  const localOcr = isLocalOcrAvailable();

  return (
    <CompactCard padding="sm">
      <p className="text-sm font-semibold">Lens capability</p>
      <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
        <li>Network: {online ? "Online — cloud OCR available when configured" : "Offline"}</li>
        <li>
          On-device OCR pack:{" "}
          {localOcr ? "Available" : "Not installed — use cloud OCR or type manually"}
        </li>
        <li>Offline translation: uses downloaded phrase packs when present</li>
        <li>Live translated overlay: not claimed in this build (capture → OCR → review)</li>
      </ul>
    </CompactCard>
  );
}
