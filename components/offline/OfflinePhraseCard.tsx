"use client";

import { useState } from "react";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceSourceBadge } from "@/components/voice/VoiceSourceBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import { DataQualityWarnings } from "@/components/ui/DataQualityWarnings";
import type { VoiceAudioType } from "@/lib/voice/voiceSchemas";
import type { OfflinePhrase } from "@/lib/schemas";
import { buildOfflineEntryAudioKey } from "@/lib/offline/offlineAudioCache";
import { CorrectionForm } from "@/components/corrections/CorrectionForm";

interface OfflinePhraseCardProps {
  phrase: OfflinePhrase;
  languageCode: string;
  packKey?: string;
  entryId?: string;
  sourceLabel?: string;
  sourceBadge?: string;
  isFavorite?: boolean;
  isEmergencyMode?: boolean;
  onPlay?: () => void;
  onToggleFavorite?: () => void;
}

export function OfflinePhraseCard({
  phrase,
  languageCode,
  packKey,
  entryId,
  sourceLabel,
  sourceBadge,
  isFavorite = false,
  isEmergencyMode = false,
  onPlay,
  onToggleFavorite,
}: OfflinePhraseCardProps) {
  const [largeText, setLargeText] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [voiceAudioType, setVoiceAudioType] = useState<VoiceAudioType | null>(null);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(null);

  const cardClassName = isEmergencyMode
    ? "border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20"
    : "";

  const offlineCacheKey =
    packKey && entryId ? buildOfflineEntryAudioKey(packKey, entryId) : undefined;

  return (
    <SectionCard className={cardClassName}>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">
            {sourceLabel ? "Original" : "English"}
          </p>
          <p className={largeText ? "text-2xl font-bold" : "text-base font-semibold"}>
            {sourceLabel ?? phrase.english}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--muted)]">Local phrase</p>
          <p
            className={
              largeText
                ? "text-3xl font-bold leading-snug text-[var(--foreground)]"
                : "text-lg font-semibold leading-snug"
            }
          >
            {phrase.target_text}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {phrase.pronunciation_simple}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge score={phrase.confidence.score} />
          <ValidationStatusBadge status={phrase.validation_status} />
          {sourceBadge && (
            <span className="rounded-full bg-[var(--background)] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {sourceBadge.replace("_", " ")}
            </span>
          )}
          {voiceAudioType && <VoiceSourceBadge audioType={voiceAudioType} />}
          {phrase.audio_type && phrase.audio_type !== "unavailable" && (
            <span className="rounded-full bg-[var(--background)] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {phrase.audio_type.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <DataQualityWarnings
          validationStatus={phrase.validation_status}
          confidenceScore={phrase.confidence.score}
          confidenceWarning={phrase.confidence.warning}
          isMockData={phrase.is_mock_data}
        />

        <p className="text-xs text-[var(--muted)]">
          Offline playback uses downloaded phrase audio when available, then device voice as
          fallback. Online AI voice is available on connected pages.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <VoiceButton
            text={phrase.target_text}
            language={languageCode}
            dialect={phrase.dialect_id}
            pronunciationSimple={phrase.pronunciation_simple}
            label="Play"
            playingLabel="Playing…"
            offlineMode
            offlineCacheKey={offlineCacheKey}
            showStatus={false}
            variant={isEmergencyMode ? "danger" : "primary"}
            onAudioTypeChange={setVoiceAudioType}
            onStatusChange={setVoiceStatusMessage}
            onPlayStart={onPlay}
            aria-label={`Play voice for ${sourceLabel ?? phrase.english}`}
          />
          <VoiceButton
            text={phrase.target_text}
            language={languageCode}
            dialect={phrase.dialect_id}
            pronunciationSimple={phrase.pronunciation_simple}
            label="Slow"
            playingLabel="Playing…"
            speed="slow"
            offlineMode
            offlineCacheKey={offlineCacheKey}
            showStatus={false}
            variant="secondary"
            onAudioTypeChange={setVoiceAudioType}
            onStatusChange={setVoiceStatusMessage}
            aria-label={`Repeat slowly for ${phrase.english}`}
          />
          <ActionButton
            variant="secondary"
            onClick={() => setLargeText((value) => !value)}
            aria-label={largeText ? "Hide large text" : "Show large text"}
            aria-pressed={largeText}
          >
            {largeText ? "Normal text" : "Large Text"}
          </ActionButton>
          {onToggleFavorite && (
            <ActionButton
              variant={isFavorite ? "primary" : "secondary"}
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              aria-pressed={isFavorite}
            >
              {isFavorite ? "Favorited" : "Favorite"}
            </ActionButton>
          )}
        </div>

        {showCorrectionForm && (
          <CorrectionForm
            defaults={{
              original_text: phrase.english,
              current_translation: phrase.target_text,
              language: languageCode,
              dialect: phrase.dialect_id,
            }}
            onClose={() => setShowCorrectionForm(false)}
            title="Correct offline phrase"
          />
        )}

        {voiceStatusMessage && (
          <p className="text-xs text-[var(--muted)]" role="status" aria-live="polite">
            {voiceStatusMessage}
          </p>
        )}
      </div>
    </SectionCard>
  );
}
