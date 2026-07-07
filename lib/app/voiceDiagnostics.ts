/**
 * Opt-in voice diagnostics for investigating mic and audio playback issues.
 * Enable with localStorage.lexienn_debug_voice = "1"
 * Never logs spoken text or transcripts in production.
 */

import type { VoiceCaptureMode } from "@/lib/voice/voiceState";
import type { VoiceAudioPlaybackPhase } from "@/lib/voice/voiceState";

export type VoiceDiagnosticEvent =
  | "mic_tap"
  | "ui_listening"
  | "recorder_start"
  | "recognition_start"
  | "first_interim"
  | "final_result"
  | "recognition_end"
  | "stop_tap"
  | "transcription_start"
  | "transcription_end"
  | "audio_request_start"
  | "audio_request_end"
  | "audio_play_start"
  | "audio_play_end"
  | "audio_error"
  | "recognition_error";

export type VoiceDebugSnapshot = {
  voiceState: string;
  captureMode: VoiceCaptureMode | null;
  selectedMimeType: string | null;
  mediaRecorderSupported: boolean;
  speechRecognitionSupported: boolean;
  micTapAt: number | null;
  uiListeningAt: number | null;
  recorderStartAt: number | null;
  recognitionStartAt: number | null;
  firstInterimAt: number | null;
  finalResultAt: number | null;
  stopTapAt: number | null;
  transcriptionStartAt: number | null;
  transcriptionEndAt: number | null;
  lastErrorCode: string | null;
  audioPlaybackState: VoiceAudioPlaybackPhase;
};

const snapshot: VoiceDebugSnapshot = {
  voiceState: "idle",
  captureMode: null,
  selectedMimeType: null,
  mediaRecorderSupported: false,
  speechRecognitionSupported: false,
  micTapAt: null,
  uiListeningAt: null,
  recorderStartAt: null,
  recognitionStartAt: null,
  firstInterimAt: null,
  finalResultAt: null,
  stopTapAt: null,
  transcriptionStartAt: null,
  transcriptionEndAt: null,
  lastErrorCode: null,
  audioPlaybackState: "idle",
};

declare global {
  interface Window {
    __lexiennDebugVoice?: () => VoiceDebugSnapshot;
  }
}

export function isVoiceDiagnosticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;

  try {
    return window.localStorage.getItem("lexienn_debug_voice") === "1";
  } catch {
    return false;
  }
}

export function updateVoiceDebugSnapshot(
  patch: Partial<VoiceDebugSnapshot>,
): void {
  Object.assign(snapshot, patch);
  if (typeof window !== "undefined" && isVoiceDiagnosticsEnabled()) {
    window.__lexiennDebugVoice = () => ({ ...snapshot });
  }
}

export function installVoiceDiagnostics(): void {
  if (typeof window === "undefined" || !isVoiceDiagnosticsEnabled()) return;
  window.__lexiennDebugVoice = () => ({ ...snapshot });
}

export function logVoiceDiagnostic(
  event: VoiceDiagnosticEvent,
  details?: { code?: string; durationMs?: number },
): void {
  const at = Date.now();
  if (event === "mic_tap") updateVoiceDebugSnapshot({ micTapAt: at });
  if (event === "ui_listening") updateVoiceDebugSnapshot({ uiListeningAt: at });
  if (event === "recorder_start") updateVoiceDebugSnapshot({ recorderStartAt: at });
  if (event === "recognition_start") updateVoiceDebugSnapshot({ recognitionStartAt: at });
  if (event === "first_interim") updateVoiceDebugSnapshot({ firstInterimAt: at });
  if (event === "final_result") updateVoiceDebugSnapshot({ finalResultAt: at });
  if (event === "stop_tap") updateVoiceDebugSnapshot({ stopTapAt: at });
  if (event === "transcription_start") updateVoiceDebugSnapshot({ transcriptionStartAt: at });
  if (event === "transcription_end") updateVoiceDebugSnapshot({ transcriptionEndAt: at });
  if (details?.code) updateVoiceDebugSnapshot({ lastErrorCode: details.code });

  if (!isVoiceDiagnosticsEnabled()) return;
  console.info("[lexienn-voice]", {
    event,
    at,
    code: details?.code,
    durationMs: details?.durationMs,
  });
}
