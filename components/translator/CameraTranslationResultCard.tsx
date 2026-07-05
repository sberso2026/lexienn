"use client";

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

interface CameraTranslationResultCardProps {
  result: TranslatorResponse;
  audioType: VoiceAudioType | null;
  isPlaying: boolean;
  statusMessage: string | null;
  onRepeatSlowly: () => void;
}

export function CameraTranslationResultCard({
  result,
  audioType,
  isPlaying,
  statusMessage,
  onRepeatSlowly,
}: CameraTranslationResultCardProps) {
  const isUnavailable = result.source === "unavailable";
  const hasTranslation = Boolean(!isUnavailable && result.translated_text);

  return (
    <CompactCard>
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

          <div className="mt-3 flex items-center gap-2">
            {isPlaying && <StatusChip label="Playing" variant="info" />}
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 3V7L8 10z" />
                </svg>
              }
              label="Speak translation"
              disabled={isPlaying}
              onClick={onRepeatSlowly}
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
          </div>
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
