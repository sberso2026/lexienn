import {
  BISAYA_MIN_AUDIO_BYTES,
  BISAYA_MIN_AUDIO_DURATION_MS,
} from "@/lib/speech/bisayaStt";

export type AudioQualityCheck = {
  ok: boolean;
  reason: string;
  warning?: string;
};

/**
 * Lightweight audio quality gate for Cebuano STT.
 * Does not decode PCM — uses duration metadata + payload size.
 * Audio is never persisted.
 */
export function checkBisayaAudioQuality(options: {
  durationMs?: number | null;
  byteLength: number;
}): AudioQualityCheck {
  const durationMs = options.durationMs ?? 0;
  if (options.byteLength < BISAYA_MIN_AUDIO_BYTES) {
    return {
      ok: false,
      reason: "audio_too_small",
      warning: "Recording was too short or silent. Please try again.",
    };
  }
  if (durationMs > 0 && durationMs < BISAYA_MIN_AUDIO_DURATION_MS) {
    return {
      ok: false,
      reason: "audio_too_short",
      warning: "Recording was too short. Hold Speak a bit longer, then try again.",
    };
  }
  // Extremely tiny bitrate ≈ silence / empty container.
  if (durationMs >= 800 && options.byteLength < 1200) {
    return {
      ok: false,
      reason: "likely_silence",
      warning: "No clear speech detected. Please try again or type manually.",
    };
  }
  return { ok: true, reason: "ok" };
}
