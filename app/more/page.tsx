import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

const moreSections = [
  {
    title: "App Experience",
    description: "Launch animation, sound, and app behavior",
    href: "/settings",
  },
  {
    title: "Voice & Microphone",
    description: "Voice preferences and microphone test",
    href: "/settings",
  },
  {
    title: "Offline",
    description: "Storage, downloaded language packs, and updates",
    href: "/offline",
  },
  {
    title: "Preferences",
    description: "Languages, translation style, and dictionary level",
    href: "/settings",
  },
  {
    title: "Install App",
    description: "PWA installation and app availability",
    href: "/settings",
  },
];

export default function MorePage() {
  const developerModeEnabled = isDeveloperModeFeatureEnabled();

  return (
    <PageContainer hideHeader>
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Personalize Lexienn
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">More</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Manage how Lexienn speaks, translates, stores offline content, and behaves as an app.
          </p>
        </section>

        <section className="card-surface overflow-hidden" aria-label="More settings">
          {moreSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--background)]"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{section.title}</span>
                <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">
                  {section.description}
                </span>
              </span>
              <span aria-hidden className="shrink-0 text-lg text-[var(--muted)]">
                ›
              </span>
            </Link>
          ))}
        </section>

        {developerModeEnabled && (
          <section aria-label="Developer settings">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Developer
            </p>
            <Link
              href="/settings"
              className="card-surface flex min-h-16 items-center justify-between gap-3 p-4"
            >
              <span>
                <span className="block text-sm font-semibold">Developer Diagnostics</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  Runtime, PWA, microphone, and provider status
                </span>
              </span>
              <span aria-hidden className="text-lg text-[var(--muted)]">
                ›
              </span>
            </Link>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
