export type MicErrorCode =
  | "mic_permission_denied"
  | "no_microphone_found"
  | "mic_in_use_or_unavailable"
  | "audio_capture_failed"
  | "insecure_context_or_policy_block"
  | "audio_constraints_failed"
  | "mic_not_supported"
  | "speech_recognition_not_supported"
  | "unknown_mic_error";

export function classifyMicError(error: unknown): MicErrorCode {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "mic_permission_denied";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "no_microphone_found";
      case "NotReadableError":
        return "mic_in_use_or_unavailable";
      case "AbortError":
        return "audio_capture_failed";
      case "SecurityError":
        return "insecure_context_or_policy_block";
      case "OverconstrainedError":
        return "audio_constraints_failed";
      default:
        break;
    }
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("not allowed") || lower.includes("permission denied")) {
      return "mic_permission_denied";
    }
    if (lower.includes("not found") || lower.includes("no microphone")) {
      return "no_microphone_found";
    }
    if (lower.includes("not supported")) {
      return "mic_not_supported";
    }
    if (lower.includes("secure context") || lower.includes("insecure")) {
      return "insecure_context_or_policy_block";
    }
  }

  return "unknown_mic_error";
}

export function isMicPermissionDenied(code: MicErrorCode): boolean {
  return code === "mic_permission_denied";
}
