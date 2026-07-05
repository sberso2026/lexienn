"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CorrectionSubmission } from "@/lib/schemas";
import { loadCorrections } from "@/lib/storage/correctionsStorage";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";

export function AdminCorrectionsPanel() {
  const [corrections, setCorrections] = useState<CorrectionSubmission[]>([]);

  const refresh = useCallback(() => {
    setCorrections(loadCorrections());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = corrections.filter((c) => c.status === "pending_sync").length;
  const preview = corrections.slice(0, 5);

  return (
    <FeatureCard title="Correction queue">
      <p className="text-sm text-[var(--muted)]">
        Local corrections submitted from dictionary results and offline phrase
        cards.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge
          label={`${corrections.length} total`}
          variant={corrections.length > 0 ? "offline" : "coming-soon"}
        />
        <StatusBadge
          label={`${pendingCount} pending sync`}
          variant={pendingCount > 0 ? "warning" : "neutral"}
        />
      </div>

      {preview.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {preview.map((correction) => (
            <li
              key={correction.id}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <p className="font-medium">{correction.original_text}</p>
              <p className="text-xs text-[var(--muted)]">
                {formatEnumLabel(correction.status)} ·{" "}
                {formatEnumLabel(correction.correction_type)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">No corrections yet.</p>
      )}

      <p className="mt-4">
        <Link
          href="/settings#corrections-queue"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
        >
          Open full corrections queue
        </Link>
      </p>
    </FeatureCard>
  );
}
