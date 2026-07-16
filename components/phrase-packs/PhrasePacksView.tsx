"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CompactCard } from "@/components/ui/CompactCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusChip } from "@/components/ui/StatusChip";
import { isTapDiagnosticsEnabled, installTapDiagnostics } from "@/lib/app/tapDiagnostics";
import {
  buildOfflinePackCatalog,
  type OfflinePackCatalogEntry,
} from "@/lib/offline/offlinePackCatalog";

function PackCard({ entry }: { entry: OfflinePackCatalogEntry }) {
  const openParams = new URLSearchParams({
    from: entry.from_language_id,
    to: entry.to_language_id,
  });
  const downloadParams = new URLSearchParams(openParams);
  downloadParams.set("download", "1");

  return (
    <li className="enterprise-card flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{entry.pair_label}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <StatusChip label={entry.kind.replace("_", " ")} variant="neutral" />
          <StatusChip label={entry.status.replace("_", " ")} variant="info" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href={`/offline?${downloadParams.toString()}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-transparent bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Download
        </Link>
        <Link
          href={`/offline?${openParams.toString()}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]"
        >
          Open
        </Link>
      </div>
    </li>
  );
}

function PackSection({
  title,
  entries,
}: {
  title: string;
  entries: OfflinePackCatalogEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <CompactCard padding="sm" className="enterprise-card">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <PackCard key={entry.id} entry={entry} />
        ))}
      </ul>
    </CompactCard>
  );
}

export function PhrasePacksView() {
  const [loaded, setLoaded] = useState(false);
  const [catalog, setCatalog] = useState<Awaited<
    ReturnType<typeof buildOfflinePackCatalog>
  > | null>(null);

  const refresh = useCallback(async () => {
    setCatalog(await buildOfflinePackCatalog());
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isTapDiagnosticsEnabled() || typeof window === "undefined") return;
    installTapDiagnostics();
  }, []);

  if (!loaded || !catalog) {
    return <LoadingState title="Loading" label="Loading packs…" />;
  }

  const totalEntries =
    catalog.downloaded.length +
    catalog.generated.length +
    catalog.curated.length +
    catalog.missing.length;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Library resources
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Offline Packs</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Download trusted language pairs for reliable use without internet.
        </p>
      </section>

      <CompactCard className="enterprise-card">
        <div className="flex items-center justify-between gap-2">
          <StatusChip label={`${totalEntries} packs`} variant="neutral" />
          <Link
            href="/offline"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-transparent bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Offline
          </Link>
        </div>
      </CompactCard>

      <PackSection title="Downloaded" entries={catalog.downloaded} />
      <PackSection title="Generated" entries={catalog.generated} />
      <PackSection title="Curated" entries={catalog.curated} />
      <PackSection title="Missing" entries={catalog.missing} />

      {totalEntries === 0 && (
        <EmptyState
          title="No packs yet"
          description="Download a language pair in Offline mode."
        />
      )}
    </div>
  );
}
