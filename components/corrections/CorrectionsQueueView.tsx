"use client";

import { useCallback, useEffect, useState } from "react";
import { CorrectionQueueCard } from "@/components/corrections/CorrectionQueueCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DEV_CORRECTIONS_INTRO, DEV_LABELS } from "@/lib/ui/developerLabels";
import type { CorrectionSubmission } from "@/lib/schemas";
import {
  advanceCorrectionSync,
  deleteCorrection,
  loadCorrections,
  syncAllPendingCorrections,
} from "@/lib/storage/correctionsStorage";

interface CorrectionsQueueViewProps {
  embedded?: boolean;
}

export function CorrectionsQueueView({ embedded = false }: CorrectionsQueueViewProps) {
  const [corrections, setCorrections] = useState<CorrectionSubmission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setCorrections(loadCorrections());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = corrections.filter((c) => c.status === "pending_sync").length;

  function handleDelete(id: string) {
    if (deleteCorrection(id)) {
      refresh();
      setMessage("Correction deleted.");
    }
  }

  function handleSync(id: string) {
    const updated = advanceCorrectionSync(id);
    if (updated) {
      refresh();
      setMessage(`Status updated to ${updated.status.replace(/_/g, " ")}.`);
    }
  }

  function handleSyncAll() {
    const count = syncAllPendingCorrections();
    refresh();
    setMessage(
      count > 0
        ? `${count} correction(s) marked ready for review.`
        : "No pending corrections to sync.",
    );
  }

  if (!loaded) {
    return <LoadingState title="Corrections" label="Loading corrections…" />;
  }

  const header = (
    <>
      <p className="text-xs text-[var(--muted)]">{DEV_CORRECTIONS_INTRO}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge
          label={`${corrections.length} total`}
          variant={corrections.length > 0 ? "success" : "neutral"}
        />
        <StatusBadge
          label={`${pendingCount} ${DEV_LABELS.pendingSync.toLowerCase()}`}
          variant={pendingCount > 0 ? "warning" : "neutral"}
        />
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={pendingCount === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)] disabled:opacity-50"
        >
          Sync all pending
        </button>
      </div>
      {message && (
        <p className="mt-3 text-xs text-[var(--muted)]" role="status">
          {message}
        </p>
      )}
    </>
  );

  return (
    <div className={embedded ? "space-y-3" : "space-y-6"}>
      {embedded ? header : <FeatureCard title={DEV_LABELS.correctionsQueue}>{header}</FeatureCard>}

      {corrections.length === 0 ? (
        <EmptyState
          title="No corrections"
          description="Submit corrections from dictionary results or offline phrase cards."
        />
      ) : (
        <ul className="space-y-3">
          {corrections.map((correction) => (
            <li key={correction.id}>
              <CorrectionQueueCard
                correction={correction}
                onDelete={handleDelete}
                onSync={handleSync}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
