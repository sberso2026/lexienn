import {
  classifyMicError,
  type MicErrorCode,
} from "@/lib/speech/classifyMicError";

export type MicPermissionPreflightResult =
  | { ok: true }
  | { ok: false; errorCode: MicErrorCode };

/**
 * Request microphone permission inside a user gesture (e.g. mic button click).
 * Stops tracks immediately after permission is granted.
 */
export async function requestMicPermissionPreflight(): Promise<MicPermissionPreflightResult> {
  if (typeof window === "undefined") {
    return { ok: false, errorCode: "unknown_mic_error" };
  }

  if (!window.isSecureContext) {
    return { ok: false, errorCode: "insecure_context_or_policy_block" };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, errorCode: "mic_not_supported" };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    return { ok: false, errorCode: classifyMicError(error) };
  }
}
