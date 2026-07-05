"use client";

import { useState } from "react";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import type { OfflineMissingRequest } from "@/lib/offline/offlinePackSchemas";
import {
  addMissingPhraseToOfflinePack,
  copyGeneratedMissingPhrase,
  generateMissingPhraseOnline,
  getMissingPhraseOfflineCacheKey,
  getMissingPhraseTranslation,
} from "@/lib/offline/offlinePackService";

interface OfflineMissingRequestsCardProps {
  requests: OfflineMissingRequest[];
  isOnline: boolean;
  isBusy?: boolean;
  onUpdated: () => Promise<void>;
  onPackUpdated?: () => Promise<void>;
  onPhraseAdded?: (requestedText: string) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const STATUS_LABELS: Record<OfflineMissingRequest["status"], string> = {
  saved_locally: "Saved locally",
  pending_sync: "Generating…",
  synced: "Generated online",
};

export function OfflineMissingRequestsCard({
  requests,
  isOnline,
  isBusy = false,
  onUpdated,
  onPackUpdated,
  onPhraseAdded,
  onSuccess,
  onError,
}: OfflineMissingRequestsCardProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handleGenerate(request: OfflineMissingRequest) {
    if (!isOnline) {
      onError("Connect to the internet to generate a translation.");
      return;
    }

    setGeneratingId(request.id);
    try {
      await generateMissingPhraseOnline(request);
      await onUpdated();
      onSuccess(`Saved ✓ translation for “${request.requested_text}”`);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Could not generate translation online.",
      );
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleCopy(request: OfflineMissingRequest) {
    setCopyingId(request.id);
    try {
      await copyGeneratedMissingPhrase(request);
      onSuccess("Copied ✓ translation to clipboard");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not copy translation.");
    } finally {
      setCopyingId(null);
    }
  }

  async function handleAddToPack(request: OfflineMissingRequest) {
    if (request.pack_entry_id) {
      onSuccess("Already in your offline pack — search for it below.");
      return;
    }

    setAddingId(request.id);
    try {
      await addMissingPhraseToOfflinePack(request);
      await onUpdated();
      await onPackUpdated?.();
      onPhraseAdded?.(request.requested_text);
      onSuccess(`Added ✓ “${request.requested_text}” to your offline pack`);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Could not add phrase to offline pack.",
      );
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SectionCard
      title="Missing phrase requests"
      subtitle="Saved on this device. Generate online, then copy, play, or add to your offline pack."
    >
      <ul className="space-y-3">
        {requests.slice(0, 8).map((request) => {
          const translation = getMissingPhraseTranslation(request);
          const toResolved = resolveLanguageSelection(request.to_language_id);
          const canGenerate =
            isOnline &&
            !translation &&
            generatingId !== request.id;
          const offlineCacheKey = getMissingPhraseOfflineCacheKey(request);
          const actionDisabled = isBusy || generatingId !== null || addingId !== null;

          return (
            <li
              key={request.id}
              className="rounded-lg border border-[var(--card-border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start gap-2">
                <span className="min-w-0 flex-1 font-medium">{request.requested_text}</span>
                <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs uppercase text-[var(--muted)]">
                  {request.pack_entry_id
                    ? "In offline pack"
                    : STATUS_LABELS[request.status]}
                </span>
              </div>

              {translation && (
                <div className="mt-3 rounded-lg bg-[var(--background)] px-3 py-2">
                  <p className="font-medium">{translation.translated_text}</p>
                  {translation.pronunciation_simple && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {translation.pronunciation_simple}
                    </p>
                  )}
                  {translation.usage_note && (
                    <p className="mt-1 text-xs text-[var(--muted)]">{translation.usage_note}</p>
                  )}
                </div>
              )}

              {translation && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    variant="secondary"
                    disabled={actionDisabled || copyingId === request.id}
                    onClick={() => void handleCopy(request)}
                  >
                    {copyingId === request.id ? "Copying…" : "Copy"}
                  </ActionButton>

                  <VoiceButton
                    text={translation.translated_text}
                    language={toResolved.base_language}
                    languageSelection={request.to_language_id}
                    dialect={toResolved.dialect_variant}
                    pronunciationSimple={translation.pronunciation_simple}
                    offlineMode={!isOnline}
                    offlineCacheKey={offlineCacheKey}
                    variant="secondary"
                    label="Play"
                    playingLabel="Playing…"
                    showBadge
                    disabled={actionDisabled}
                  />

                  <ActionButton
                    variant="secondary"
                    disabled={actionDisabled || Boolean(request.pack_entry_id)}
                    onClick={() => void handleAddToPack(request)}
                  >
                    {addingId === request.id
                      ? "Adding…"
                      : request.pack_entry_id
                        ? "Added to pack"
                        : "Add to offline pack"}
                  </ActionButton>
                </div>
              )}

              {!translation && (
                <div className="mt-3">
                  <ActionButton
                    variant="secondary"
                    disabled={!canGenerate || actionDisabled}
                    onClick={() => void handleGenerate(request)}
                  >
                    {generatingId === request.id
                      ? "Generating…"
                      : isOnline
                        ? "Generate when online"
                        : "Generate when online (offline)"}
                  </ActionButton>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
