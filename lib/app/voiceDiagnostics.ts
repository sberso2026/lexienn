/**
 * Opt-in voice diagnostics for investigating mic and audio playback issues.
 * Enable with localStorage.lexienn_debug_voice = "1"
 * Never logs spoken text or transcripts in production.
 */

export type VoiceDiagnosticEvent =
  | "mic_tap"
  | "ui_listening"
  | "recognition_start"
  | "first_interim"
  | "final_result"
  | "recognition_end"
  | "stop_tap"
  | "audio_request_start"
  | "audio_request_end"
  | "audio_play_start"
  | "audio_play_end"
  | "audio_error"
  | "recognition_error";

export function isVoiceDiagnosticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;

  try {
    return window.localStorage.getItem("lexienn_debug_voice") === "1";
  } catch {
    return false;
  }
}

export function logVoiceDiagnostic(
  event: VoiceDiagnosticEvent,
  details?: { code?: string; durationMs?: number },
): void {
  if (!isVoiceDiagnosticsEnabled()) return;
  console.info("[lexienn-voice]", {
    event,
    at: Date.now(),
    code: details?.code,
    durationMs: details?.durationMs,
  });
}
