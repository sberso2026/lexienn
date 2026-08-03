"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/PageContainer";
import { LensModeTabs } from "@/components/lens/LensModeTabs";
import { LensScanHistory } from "@/components/lens/LensScanHistory";
import { LensCapabilityStatus } from "@/components/lens/LensCapabilityStatus";
import type { LensMode } from "@/lib/lens/lensTypes";

const CameraTranslatorView = dynamic(
  () =>
    import("@/components/translator/CameraTranslatorView").then((mod) => ({
      default: mod.CameraTranslatorView,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        Loading Lens scanner…
      </p>
    ),
  },
);

export function LensView() {
  const [mode, setMode] = useState<LensMode>("live_scan");

  return (
    <PageContainer hideHeader>
      <div className="space-y-5 pb-4">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Visual language tools
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Lens</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Scan signs, menus, labels, tickets, and notices. Review OCR text, translate,
            tap words to define, and save to Library.
          </p>
        </section>

        <LensModeTabs mode={mode} onChange={setMode} />
        <LensCapabilityStatus />

        {mode === "history" ? (
          <LensScanHistory />
        ) : (
          <section aria-labelledby="lens-scanner-title">
            <h2 id="lens-scanner-title" className="sr-only">
              {mode === "import" ? "Import Image" : mode === "capture" ? "Capture" : "Live Scan"}
            </h2>
            <CameraTranslatorView
              preferCamera={mode === "live_scan" || mode === "capture"}
              preferImport={mode === "import"}
            />
          </section>
        )}
      </div>
    </PageContainer>
  );
}
