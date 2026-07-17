"use client";

import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/PageContainer";

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
  return (
    <PageContainer hideHeader>
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Visual language tools
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Lens</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Scan or import real-world text, then translate it with the existing OCR workflow.
          </p>
        </section>

        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Lens modes"
        >
          <div className="flex min-h-16 flex-col justify-center rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-2 py-2 text-white">
            <span className="text-xs font-semibold">Scan Text</span>
            <span className="mt-0.5 text-[10px] text-white/70">Camera scanner</span>
          </div>
          <div className="flex min-h-16 flex-col justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-2 py-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">Import Image</span>
            <span className="mt-0.5 text-[10px]">Use Import below</span>
          </div>
          <div className="flex min-h-16 flex-col justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-2 py-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">History</span>
            <span className="mt-0.5 text-[10px]">Recent scans</span>
          </div>
        </div>

        <section aria-labelledby="lens-scanner-title">
          <h2 id="lens-scanner-title" className="sr-only">
            Scan Text
          </h2>
          <CameraTranslatorView />
        </section>

        <section className="card-surface enterprise-card p-4" aria-labelledby="lens-history-title">
          <h2 id="lens-history-title" className="text-sm font-semibold">
            History
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Recent scans will appear here after you save translated text to Library.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
