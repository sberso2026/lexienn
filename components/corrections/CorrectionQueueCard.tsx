"use client";

import { FeatureCard } from "@/components/ui/FeatureCard";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCatalogDialectById } from "@/lib/admin/catalog";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { getLanguageByCode } from "@/lib/mock";
import type { CorrectionSubmission } from "@/lib/schemas";

interface CorrectionQueueCardProps {
  correction: CorrectionSubmission;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
}

function statusVariant(
  status: CorrectionSubmission["status"],
): "warning" | "offline" | "beta" | "neutral" {
  if (status === "pending_sync") return "warning";
  if (status === "ready_for_review") return "beta";
  return "neutral";
}

function syncButtonLabel(status: CorrectionSubmission["status"]): string | null {
  if (status === "pending_sync") return "Mark ready for review";
  if (status === "ready_for_review") return "Simulate sync";
  return null;
}

export function CorrectionQueueCard({
  correction,
  onDelete,
  onSync,
}: CorrectionQueueCardProps) {
  const language = getLanguageByCode(correction.language);
  const dialect = correction.dialect
    ? getCatalogDialectById(correction.dialect)
    : undefined;
  const created = new Date(correction.created_at).toLocaleString();
  const syncLabel = syncButtonLabel(correction.status);

  return (
    <FeatureCard>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{correction.original_text}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge
                label={formatEnumLabel(correction.status)}
                variant={statusVariant(correction.status)}
              />
              <StatusBadge
                label={formatEnumLabel(correction.correction_type)}
                variant="coming-soon"
              />
              {correction.is_native_speaker && (
                <StatusBadge label="Native speaker" variant="offline" />
              )}
              {correction.is_profession_reviewer && (
                <StatusBadge label="Profession reviewer" variant="beta" />
              )}
            </div>
          </div>
          <LanguageBadge
            language={language?.name ?? correction.language}
            dialect={dialect?.variant_label ?? correction.dialect}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">
            Current translation
          </p>
          <p className="text-sm">{correction.current_translation}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">
            Suggested correction
          </p>
          <p className="text-sm font-medium">{correction.suggested_correction}</p>
        </div>

        {correction.contributor_note && (
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Contributor note
            </p>
            <p className="text-sm">{correction.contributor_note}</p>
          </div>
        )}

        <p className="text-xs text-[var(--muted)]">Submitted {created}</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {syncLabel && (
            <button
              type="button"
              onClick={() => onSync(correction.id)}
              aria-label={`${syncLabel} for ${correction.original_text}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              {syncLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(correction.id)}
            aria-label={`Delete correction for ${correction.original_text}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      </div>
    </FeatureCard>
  );
}
