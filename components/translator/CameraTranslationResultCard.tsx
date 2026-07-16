"use client";

import { useCallback, useState } from "react";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { IconButton } from "@/components/ui/IconButton";
import { StatusChip } from "@/components/ui/StatusChip";
import { TranslationSourceBadge } from "@/components/ui/TranslationSourceBadge";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { VoiceSourceBadge } from "@/components/voice/VoiceSourceBadge";
import type { TranslatorResponse } from "@/lib/translator/translatorSchemas";
import type { VoiceAudioType } from "@/lib/voice/voiceSchemas";
import { saveTranslatedPhrase } from "@/lib/storage/savedPhrasesStorage";

interface CameraTranslationResultCardProps {
  result: TranslatorResponse;
  audioType: VoiceAudioType | null;
  isPlaying: boolean;
  statusMessage: string | null;
  onPlay: () => void;
  onRepeatSlowly: () => void;
}

export function CameraTranslationResultCard({
  result,
  audioType,
  isPlaying,
  statusMessage,
  onPlay,
  onRepeatSlowly,
}: CameraTranslationResultCardProps) {
  const isUnavailable = result.source === "unavailable";
  const hasTranslation = Boolean(!isUnavailable && result.translated_text);
  const [feedback, setFeedback] = useState<string | null>(null);

  const copyTranslation = useCallback(async () => {
    if (!result.translated_text) return;
    try {
      await navigator.clipboard.writeText(result.translated_text);
      setFeedback("Copied translation.");
    } catch {
      setFeedback("Could not copy translation.");
    }
  }, [result.translated_text]);

  const saveTranslation = useCallback(() => {
    if (!result.translated_text) return;
    const outcome = saveTranslatedPhrase({
      sourceText: result.original_text,
      translatedText: result.translated_text,
      sourceLanguage: result.source_language,
      targetLanguage: result.target_language,
      pronunciation: result.pronunciation_simple,
    });
    setFeedback(
      outcome === "saved"
        ? "Saved to Library."
        : outcome === "duplicate"
          ? "Already saved in Library."
          : "Could not save translation.",
    );
  }, [result]);

  return (
    <CompactCard className="enterprise-card">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <TranslationSourceBadge source={result.source} />
        {!isUnavailable && (
          <>
            <ValidationStatusBadge status={result.validation_status} />
            <ConfidenceBadge score={result.confidence_score} />
            {audioType && <VoiceSourceBadge audioType={audioType} />}
          </>
        )}
      </div>

      {isUnavailable && result.unavailable_reason && (
        <CompactAlert variant="warning">{result.unavailable_reason}</CompactAlert>
      )}

      {hasTranslation && (
        <>
          <p className="text-lg font-semibold leading-snug">{result.translated_text}</p>
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
            {result.original_text}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isPlaying && <StatusChip label="Playing" variant="info" />}
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 3V7L8 10z" />
                </svg>
              }
              label="Speak translation"
              disabled={isPlaying}
              onClick={onPlay}
            />
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Repeat slowly"
              disabled={isPlaying}
              onClick={onRepeatSlowly}
            />
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              label="Copy translation"
              onClick={() => void copyTranslation()}
            />
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              }
              label="Save translation to Library"
              onClick={saveTranslation}
            />
          </div>
          {result.pronunciation_simple && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Pronunciation:</span>{" "}
              {result.pronunciation_simple}
            </p>
          )}
          {feedback && (
            <p className="mt-2 text-xs text-[var(--muted)]" role="status" aria-live="polite">
              {feedback}
            </p>
          )}
        </>
      )}

      {statusMessage && (
        <p className="mt-2 text-[10px] text-[var(--muted)]" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </CompactCard>
  );
}
