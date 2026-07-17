import { PageContainer } from "@/components/layout/PageContainer";
import { AboutReleasePanel } from "@/components/settings/AboutReleasePanel";

export default function AboutPage() {
  return (
    <PageContainer hideHeader>
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Release
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">About</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Safe release metadata for support and production verification.
          </p>
        </section>
        <AboutReleasePanel />
      </div>
    </PageContainer>
  );
}
