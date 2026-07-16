import Image from "next/image";
import Link from "next/link";
import { HEADER_LOGO_MARK_PATH, brandAssetUrl } from "@/lib/brand/brandAssetPaths";

type IconName =
  | "book"
  | "microphone"
  | "scan"
  | "download"
  | "clock"
  | "travel"
  | "engineering"
  | "emergency"
  | "business";

function DashboardIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 016.5 3H11v16H6.5A2.5 2.5 0 004 21V5.5z" />
        <path d="M20 5.5A2.5 2.5 0 0017.5 3H13v16h4.5A2.5 2.5 0 0120 21V5.5z" />
      </>
    ),
    microphone: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0014 0M12 18v3" />
      </>
    ),
    scan: (
      <>
        <path d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
        <path d="M8 10h8v4H8z" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 20h14" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    travel: (
      <>
        <path d="M3 17l18-7-7 11-2-7-9 3z" />
        <path d="M12 14l4-4" />
      </>
    ),
    engineering: (
      <>
        <path d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-6h6v6" />
      </>
    ),
    emergency: (
      <>
        <path d="M12 3l10 18H2L12 3z" />
        <path d="M12 9v5m0 3h.01" />
      </>
    ),
    business: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const quickActions = [
  {
    href: "/dictionary",
    label: "Define a word",
    description: "Meanings with professional context",
    icon: "book" as const,
  },
  {
    href: "/translator",
    label: "Translate speech",
    description: "Speak naturally in 40+ languages",
    icon: "microphone" as const,
  },
  {
    href: "/lens",
    label: "Scan text",
    description: "Read signs, documents, and labels",
    icon: "scan" as const,
  },
  {
    href: "/offline",
    label: "Use offline pack",
    description: "Keep working without a connection",
    icon: "download" as const,
  },
];

const recentActivity = ["acceleration", "tie beam", "what’s your name?", "microcracking"];

const suggestedPacks = [
  { label: "Travel", icon: "travel" as const },
  { label: "Engineering", icon: "engineering" as const },
  { label: "Emergency", icon: "emergency" as const },
  { label: "Business", icon: "business" as const },
];

export function HomeDashboard() {
  return (
    <div className="space-y-5 pb-2">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Image
            src={brandAssetUrl(HEADER_LOGO_MARK_PATH)}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
            priority
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-[var(--accent)]">Lexienn</p>
            <h2 className="text-sm font-medium text-[var(--muted)]">Language Intelligence</h2>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground)]">
          Understand words, conversations, and real-world text with intelligent tools that stay
          useful online or offline.
        </p>
      </section>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Start here
            </p>
            <h2 id="quick-actions-title" className="mt-1 text-lg font-semibold tracking-tight">
              Quick Actions
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card-surface flex min-h-32 flex-col p-4 transition-colors hover:border-[var(--accent)] focus-visible:border-[var(--accent)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <DashboardIcon name={action.icon} />
              </span>
              <span className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                {action.label}
              </span>
              <span className="mt-1 text-xs leading-4 text-[var(--muted)]">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card-surface p-4" aria-labelledby="recent-activity-title">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[var(--accent)]">
              <DashboardIcon name="clock" />
            </span>
            <h2 id="recent-activity-title" className="text-sm font-semibold">
              Recent Activity
            </h2>
          </div>
          <ul className="divide-y divide-[var(--border-subtle)]">
            {recentActivity.map((item) => (
              <li key={item}>
                <Link
                  href="/dictionary"
                  className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium"
                >
                  <span className="truncate">{item}</span>
                  <span aria-hidden className="text-[var(--muted)]">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-[var(--radius-xl)] border border-[#214d79] bg-[var(--accent)] p-4 text-white"
          aria-labelledby="offline-ready-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                Offline Ready
              </p>
              <h2 id="offline-ready-title" className="mt-2 text-base font-semibold">
                English ↔ Filipino
              </h2>
              <p className="mt-1 text-xs text-white/75">246 phrases · 42 audio clips</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <DashboardIcon name="download" />
            </span>
          </div>
          <div className="mt-5 flex min-h-11 items-center justify-between border-t border-white/15 pt-3">
            <span className="text-xs font-medium text-white/80">Updated today</span>
            <Link href="/offline" className="text-xs font-semibold underline-offset-4 hover:underline">
              Open pack
            </Link>
          </div>
        </section>
      </div>

      <section aria-labelledby="suggested-packs-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="suggested-packs-title" className="text-lg font-semibold tracking-tight">
            Suggested Packs
          </h2>
          <Link href="/phrase-packs" className="min-h-11 py-3 text-xs font-semibold text-[var(--accent)]">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {suggestedPacks.map((pack) => (
            <Link
              key={pack.label}
              href="/phrase-packs"
              className="card-surface flex min-h-20 items-center gap-3 p-3 text-sm font-semibold"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <DashboardIcon name={pack.icon} />
              </span>
              <span className="min-w-0 truncate">{pack.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
