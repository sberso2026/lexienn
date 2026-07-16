import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";

const libraryItems = [
  { label: "Saved Words", count: "128 items", href: "/dictionary", icon: "W" },
  { label: "Saved Phrases", count: "64 items", href: "/phrase-packs", icon: "P" },
  { label: "Offline Packs", count: "3 packs", href: "/offline", icon: "O" },
  { label: "Profession Packs", count: "8 packs", href: "/phrase-packs", icon: "Pr" },
  { label: "Recent Searches", count: "24 items", href: "/dictionary", icon: "R" },
  { label: "Favorites", count: "42 items", href: "/dictionary", icon: "F" },
];

export default function LibraryPage() {
  return (
    <PageContainer hideHeader>
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Your language resources
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Library</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Return to saved language, downloaded packs, and recent work.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Library collections">
          {libraryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="card-surface flex min-h-20 items-center gap-3 p-4 transition-colors hover:border-[var(--accent)]"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]"
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{item.count}</span>
              </span>
              <span aria-hidden className="text-lg text-[var(--muted)]">
                ›
              </span>
            </Link>
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
