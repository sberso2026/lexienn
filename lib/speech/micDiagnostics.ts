import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import { isBrowserSpeechRecognitionSupported } from "@/lib/speech/browserSpeechRecognition";
import type { MicErrorCode } from "@/lib/speech/classifyMicError";
import { requestMicPermissionPreflight } from "@/lib/speech/requestMicPermission";

export type MicDiagnosticsSnapshot = {
  mediaDevicesAvailable: boolean;
  isSecureContext: boolean;
  platform: ReturnType<typeof detectClientPlatform>;
  speechRecognitionSupported: boolean;
  getUserMediaResult: "not_tested" | "granted" | "denied" | "error";
  lastErrorCode: MicErrorCode | null;
  testedAt: string | null;
};

export function getMicDiagnosticsSnapshot(): MicDiagnosticsSnapshot {
  const platform = detectClientPlatform();
  return {
    mediaDevicesAvailable:
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
    isSecureContext: platform.isSecureContext,
    platform,
    speechRecognitionSupported: isBrowserSpeechRecognitionSupported(),
    getUserMediaResult: "not_tested",
    lastErrorCode: null,
    testedAt: null,
  };
}

export async function runMicDiagnosticsTest(): Promise<MicDiagnosticsSnapshot> {
  const platform = detectClientPlatform();
  const base = getMicDiagnosticsSnapshot();
  const preflight = await requestMicPermissionPreflight();

  return {
    ...base,
    getUserMediaResult: preflight.ok
      ? "granted"
      : preflight.errorCode === "mic_permission_denied"
        ? "denied"
        : "error",
    lastErrorCode: preflight.ok ? null : preflight.errorCode,
    testedAt: new Date().toISOString(),
    platform,
  };
}
