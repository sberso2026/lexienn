"use client";

import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/StatusBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { PHRASE_CATEGORY_LABELS } from "@/lib/mock/phrase-categories";
import { getDialectById, getLanguageById } from "@/lib/mock";
import type { OfflinePhrasePack } from "@/lib/schemas";

interface PhrasePackCardProps {
  pack: OfflinePhrasePack;
  isDownloaded: boolean;
  onMarkDownloaded: (packId: string) => void;
  onRemoveDownloaded: (packId: string) => void;
}

export function PhrasePackCard({
  pack,
  isDownloaded,
  onMarkDownloaded,
  onRemoveDownloaded,
}: PhrasePackCardProps) {
  const language = getLanguageById(pack.language_id);
  const dialect = getDialectById(pack.dialect_id);

  return (
    <SectionCard>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              {pack.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {language?.name ?? pack.language_id}
              {dialect ? ` · ${dialect.variant_label}` : ""}
            </p>
          </div>
          <Badge
            label={isDownloaded ? "Downloaded" : "Not downloaded"}
            variant={isDownloaded ? "success" : "neutral"}
          />
        </div>

        {pack.description && (
          <p className="text-sm leading-relaxed text-[var(--muted)]">{pack.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span>{pack.phrase_count} phrases</span>
          <span aria-hidden>·</span>
          <span>~{pack.estimated_size_kb} KB</span>
          <span aria-hidden>·</span>
          <span>Text + offline device voice fallback</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {pack.categories.map((category) => (
            <span
              key={category}
              className="rounded-lg bg-[var(--background)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              {PHRASE_CATEGORY_LABELS[category]}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isDownloaded ? (
            <>
              <ActionButton variant="secondary" disabled aria-label="Pack already downloaded">
                Downloaded
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => onRemoveDownloaded(pack.id)}
                aria-label={`Remove ${pack.name} from offline storage`}
              >
                Remove
              </ActionButton>
              <Link
                href="/offline"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-center text-sm font-semibold hover:bg-[var(--background)] sm:flex-none"
              >
                Open Offline
              </Link>
            </>
          ) : (
            <ActionButton
              onClick={() => onMarkDownloaded(pack.id)}
              fullWidth
              aria-label={`Download ${pack.name} for offline use`}
            >
              Download
            </ActionButton>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
