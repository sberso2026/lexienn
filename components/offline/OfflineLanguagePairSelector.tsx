"use client";

import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/StatusBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import type { OfflinePackAvailability } from "@/lib/offline/offlinePackService";

interface OfflineLanguagePairSelectorProps {
  fromLanguage: string;
  toLanguage: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  availability: OfflinePackAvailability | null;
  isOnline: boolean;
  isBusy: boolean;
  pairSelected: boolean;
  onDownload: () => void;
  onUpdate: () => void;
  onRemove: () => void;
}

export function OfflineLanguagePairSelector({
  fromLanguage,
  toLanguage,
  onFromChange,
  onToChange,
  availability,
  isOnline,
  isBusy,
  pairSelected,
  onDownload,
  onUpdate,
  onRemove,
}: OfflineLanguagePairSelectorProps) {
  const status = availability?.status ?? "missing";
  const hasPack =
    status === "downloaded" ||
    status === "update_available" ||
    status === "text_ready" ||
    status === "audio_downloading";

  return (
    <SectionCard
      title="Language pair"
      subtitle="Choose any From → To pair from the language list. Dialect and regional variants are supported on the To side."
    >
      <div className="space-y-4">
        <SearchableLanguageSelectField
          id="offline-from-language"
          label="From"
          value={fromLanguage}
          onChange={onFromChange}
          placeholder="Select source language"
          hint="Source language for phrase cards."
        />
        <SearchableLanguageSelectField
          id="offline-to-language"
          label="To"
          value={toLanguage}
          onChange={onToChange}
          placeholder="Select target language"
          hint="Target language or regional variant."
        />

        {pairSelected && availability && (
          <p className="rounded-lg bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
            {availability.availabilityMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {pairSelected && (
            <Badge label={`Est. ${availability?.estimatedSizeLabel ?? "—"}`} variant="neutral" />
          )}
          {availability?.packTierLabel && (
            <Badge label={availability.packTierLabel} variant="neutral" />
          )}
          {availability?.textCoverageLabel && (
            <Badge label={availability.textCoverageLabel} variant="info" />
          )}
          {availability?.audioCoverageLabel && (
            <Badge label={availability.audioCoverageLabel} variant="info" />
          )}
          {availability?.pack && (
            <Badge
              label={availability.pack.source.replace("_", " ")}
              variant={availability.pack.source === "curated" ? "success" : "info"}
            />
          )}
        </div>

        {pairSelected && (
          <div className="grid gap-2 sm:grid-cols-3">
            {!hasPack && (
              <ActionButton
                variant="primary"
                onClick={onDownload}
                disabled={isBusy || !isOnline || !availability?.canGenerate}
                aria-label="Download offline phrase pack"
              >
                {isBusy ? "Downloading…" : "Download pack"}
              </ActionButton>
            )}

            {status === "update_available" && (
              <ActionButton
                variant="primary"
                onClick={onUpdate}
                disabled={isBusy || !isOnline}
                aria-label="Update offline phrase pack"
              >
                {isBusy ? "Updating…" : "Update pack"}
              </ActionButton>
            )}

            {hasPack && status === "downloaded" && (
              <ActionButton
                variant="secondary"
                onClick={onUpdate}
                disabled={isBusy || !isOnline}
                aria-label="Check for pack update"
              >
                Check update
              </ActionButton>
            )}

            {hasPack && (
              <ActionButton
                variant="secondary"
                onClick={onRemove}
                disabled={isBusy}
                aria-label="Remove downloaded offline pack"
              >
                Remove pack
              </ActionButton>
            )}
          </div>
        )}

        {pairSelected && !isOnline && status === "missing" && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            No offline pack downloaded for this language pair.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
