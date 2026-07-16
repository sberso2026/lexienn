import { CameraTranslatorView } from "@/components/translator/CameraTranslatorView";
import { PageContainer } from "@/components/layout/PageContainer";

const lensModes = [
  { label: "Scan Text", description: "Camera scanner", active: true },
  { label: "Import Image", description: "Choose a photo", active: false },
  { label: "History", description: "Recent scans", active: false },
];

export default function LensPage() {
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

        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Lens modes">
          {lensModes.map((mode) => (
            <div
              key={mode.label}
              role="tab"
              aria-selected={mode.active}
              className={`flex min-h-16 flex-col justify-center rounded-xl border px-3 py-2 ${
                mode.active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
              }`}
            >
              <span className="text-xs font-semibold">{mode.label}</span>
              <span className={`mt-0.5 text-[10px] ${mode.active ? "text-white/70" : ""}`}>
                {mode.description}
              </span>
            </div>
          ))}
        </div>

        <section className="card-surface p-4" aria-labelledby="lens-scanner-title">
          <h2 id="lens-scanner-title" className="mb-4 text-sm font-semibold">
            Scan Text
          </h2>
          <CameraTranslatorView />
        </section>
      </div>
    </PageContainer>
  );
}
