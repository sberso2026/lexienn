"use client";

import { useEffect } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { VoiceSourceBadge } from "@/components/voice/VoiceSourceBadge";
import { preloadSpeechVoices } from "@/lib/audio/speechSynthesis";
import { isBrowserSpeechSupported } from "@/lib/voice/browserSpeech";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";
import type { VoiceSpeed } from "@/lib/voice/voiceSchemas";

interface VoiceButtonProps {
  text: string;
  language: string;
  languageSelection?: string;
  dialect?: string;
  pronunciationSimple?: string;
  speed?: VoiceSpeed;
  label?: string;
  playingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  disabled?: boolean;
  offlineMode?: boolean;
  offlineCacheKey?: string;
  nativeAudioUrl?: string;
  showBadge?: boolean;
  showStatus?: boolean;
  className?: string;
  "aria-label"?: string;
  onAudioTypeChange?: (audioType: ReturnType<typeof useVoicePlayback>["audioType"]) => void;
  onStatusChange?: (message: string | null) => void;
  onPlayStart?: () => void;
}

export function VoiceButton({
  text,
  language,
  languageSelection,
  dialect,
  pronunciationSimple,
  speed = "normal",
  label = "Play Voice",
  playingLabel = "Playing…",
  variant = "primary",
  fullWidth = false,
  disabled = false,
  offlineMode = false,
  offlineCacheKey,
  nativeAudioUrl,
  showBadge = false,
  showStatus = true,
  className,
  "aria-label": ariaLabel,
  onAudioTypeChange,
  onStatusChange,
  onPlayStart,
}: VoiceButtonProps) {
  const { isPlaying, audioType, statusMessage, canPlay, play } = useVoicePlayback({
    text,
    language,
    languageSelection,
    dialect,
    pronunciationSimple,
    nativeAudioUrl,
    offlineCacheKey,
    offlineMode,
    disabled,
  });

  useEffect(() => {
    if (isBrowserSpeechSupported()) {
      void preloadSpeechVoices();
    }
  }, []);

  useEffect(() => {
    onAudioTypeChange?.(audioType);
  }, [audioType, onAudioTypeChange]);

  useEffect(() => {
    onStatusChange?.(statusMessage);
  }, [statusMessage, onStatusChange]);

  const playbackDisabled = disabled || !text.trim() || (!canPlay && audioType === "unavailable");

  return (
    <div className={className}>
      <ActionButton
        variant={variant}
        fullWidth={fullWidth}
        disabled={playbackDisabled || isPlaying}
        aria-label={ariaLabel ?? label}
        onClick={() => {
          onPlayStart?.();
          void play(speed);
        }}
      >
        {isPlaying ? playingLabel : label}
      </ActionButton>

      {showBadge && audioType && (
        <div className="mt-2">
          <VoiceSourceBadge audioType={audioType} />
        </div>
      )}

      {showStatus && statusMessage && (
        <p className="mt-2 text-xs text-[var(--muted)]" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
