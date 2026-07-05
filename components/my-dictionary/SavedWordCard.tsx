"use client";

import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import { DataQualityWarnings } from "@/components/ui/DataQualityWarnings";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { getDialectById, getLanguageByCode, getUserContextProfile } from "@/lib/mock";
import type { SavedWord } from "@/lib/schemas";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SavedWordCardProps {
  word: SavedWord;
  onRemove: (id: string) => void;
}

export function SavedWordCard({ word, onRemove }: SavedWordCardProps) {
  const targetLang = getLanguageByCode(word.target_language);
  const dialect = word.target_dialect
    ? getDialectById(word.target_dialect)
    : undefined;
  const contextProfile = getUserContextProfile(word.user_context);
  const savedDate = new Date(word.saved_at).toLocaleString();

  return (
    <FeatureCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{word.input_text}</h3>
            <StatusBadge
              label={formatEnumLabel(word.entry_type)}
              variant="beta"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LanguageBadge
              language={targetLang?.name ?? word.target_language}
              dialect={dialect?.variant_label}
            />
            <StatusBadge
              label={contextProfile?.label ?? formatEnumLabel(word.user_context)}
              variant="coming-soon"
            />
            <ValidationStatusBadge status={word.validation_status} />
            <ConfidenceBadge score={word.confidence_score} />
          </div>

          <DataQualityWarnings
            validationStatus={word.validation_status}
            confidenceScore={word.confidence_score}
          />

          <p className="mt-3 text-sm text-[var(--muted)]">{word.short_meaning}</p>
          <p className="mt-2 text-sm font-medium">{word.target_meaning}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Pronunciation: {word.pronunciation_simple}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">Saved {savedDate}</p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(word.id)}
          aria-label={`Remove ${word.input_text} from My Dictionary`}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          Remove
        </button>
      </div>
    </FeatureCard>
  );
}
