"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { VoiceSourceBadge } from "@/components/voice/VoiceSourceBadge";
import type { OfflinePackEntry } from "@/lib/offline/offlinePackSchemas";
import { buildOfflineEntryAudioKey } from "@/lib/offline/offlineAudioCache";
import {
  getLocalResponseText,
  LOCAL_RESPONSES,
  type LocalResponse,
} from "@/lib/offline/localResponses";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";
import type { VoiceAudioType } from "@/lib/voice/voiceSchemas";

interface LocalResponseButtonsProps {
  languageCode: string;
  packKey?: string;
  packEntries?: OfflinePackEntry[];
  isEmergencyMode?: boolean;
}

function findPackResponseEntry(
  response: LocalResponse,
  packEntries?: OfflinePackEntry[],
): OfflinePackEntry | undefined {
  if (!packEntries?.length) return undefined;

  const byEnglish = packEntries.find(
    (entry) => entry.source_text.toLowerCase() === response.english.toLowerCase(),
  );
  if (byEnglish) return byEnglish;

  return packEntries.find(
    (entry) => entry.source_text.toLowerCase() === response.label.toLowerCase(),
  );
}

function findPackResponseTranslation(
  response: LocalResponse,
  packEntries?: OfflinePackEntry[],
): string | undefined {
  return findPackResponseEntry(response, packEntries)?.translated_text;
}

export function LocalResponseButtons({
  languageCode,
  packKey,
  packEntries,
  isEmergencyMode = false,
}: LocalResponseButtonsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [voiceAudioType, setVoiceAudioType] = useState<VoiceAudioType | null>(null);
  const { play, statusMessage, audioType } = useVoicePlayback({
    text: "",
    language: languageCode,
    offlineMode: true,
  });

  useEffect(() => {
    if (audioType) setVoiceAudioType(audioType);
  }, [audioType]);

  useEffect(() => {
    return () => stopVoicePlayback();
  }, []);

  const handleSpeak = useCallback(
    (response: LocalResponse) => {
      const entry = findPackResponseEntry(response, packEntries);
      const text =
        entry?.translated_text ??
        findPackResponseTranslation(response, packEntries) ??
        getLocalResponseText(response, languageCode);
      setExpandedId(response.id);
      void play("normal", {
        text,
        pronunciationSimple: entry?.pronunciation_simple ?? response.pronunciation_simple,
        offlineCacheKey:
          packKey && entry ? buildOfflineEntryAudioKey(packKey, entry.id) : undefined,
      });
    },
    [languageCode, packEntries, packKey, play],
  );

  return (
    <SectionCard
      title="Local response board"
      className={isEmergencyMode ? "border-2 border-red-300" : ""}
    >
      <p className="mb-4 text-sm text-[var(--muted)]">
        Tap a response for the other person to read or hear. Offline mode uses device voice
        when downloaded audio is not available.
      </p>

      {voiceAudioType && (
        <div className="mb-4">
          <VoiceSourceBadge audioType={voiceAudioType} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {LOCAL_RESPONSES.map((response) => {
          const targetText =
            findPackResponseTranslation(response, packEntries) ??
            getLocalResponseText(response, languageCode);
          const isExpanded = expandedId === response.id;

          return (
            <button
              key={response.id}
              type="button"
              onClick={() => handleSpeak(response)}
              aria-label={`${response.label}: ${targetText}`}
              className={`flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border px-3 py-3 text-center transition-colors ${
                isEmergencyMode
                  ? "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                  : "border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--card)]"
              } ${isExpanded ? "ring-2 ring-[var(--accent-indigo)]" : ""}`}
            >
              <span className="text-sm font-semibold">{response.label}</span>
              <span
                className={`mt-1 text-[var(--muted)] ${
                  isExpanded ? "text-base font-bold text-[var(--foreground)]" : "text-xs"
                }`}
              >
                {targetText}
              </span>
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <p className="mt-3 text-xs text-[var(--muted)]" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </SectionCard>
  );
}
