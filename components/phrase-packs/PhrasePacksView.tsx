"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CompactCard } from "@/components/ui/CompactCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusChip } from "@/components/ui/StatusChip";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  buildOfflinePackCatalog,
  getOfflineCatalogLink,
  type OfflinePackCatalogEntry,
} from "@/lib/offline/offlinePackCatalog";

function PackCard({ entry }: { entry: OfflinePackCatalogEntry }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{entry.pair_label}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <StatusChip label={entry.kind.replace("_", " ")} variant="neutral" />
          <StatusChip label={entry.status.replace("_", " ")} variant="info" />
        </div>
      </div>
      <Link href={getOfflineCatalogLink(entry.from_language_id, entry.to_language_id)}>
        <ActionButton variant="secondary">Open</ActionButton>
      </Link>
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
    <CompactCard padding="sm">
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

  if (!loaded || !catalog) {
    return <LoadingState title="Loading" label="Loading packs…" />;
  }

  const totalEntries =
    catalog.downloaded.length +
    catalog.generated.length +
    catalog.curated.length +
    catalog.missing.length;

  return (
    <div className="space-y-3">
      <CompactCard>
        <div className="flex items-center justify-between gap-2">
          <StatusChip label={`${totalEntries} packs`} variant="neutral" />
          <Link href="/offline">
            <ActionButton variant="primary">Offline</ActionButton>
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
