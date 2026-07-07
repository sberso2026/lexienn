import type { ClientPlatform } from "@/lib/platform/detectClientPlatform";
import type { MicErrorCode } from "@/lib/speech/classifyMicError";

export type MicUserMessage = {
  title?: string;
  body: string;
  steps?: string[];
};

const IOS_SAFARI_PERMISSION_STEPS = [
  "Open Lexienn in Safari.",
  "Tap AA or the site settings icon in the address bar.",
  "Tap Website Settings.",
  "Set Microphone to Ask or Allow.",
  "Refresh the page and tap Speak again.",
];

const IOS_PWA_PERMISSION_STEPS = [
  "If the home-screen app does not ask for microphone permission, open Lexienn in Safari first.",
  "Allow microphone access in Safari.",
  "Then reinstall or reopen the home-screen shortcut.",
];

export function getMicPreflightHint(platform: ClientPlatform): string {
  if (platform.isIos) {
    return "Your phone may ask for microphone permission.";
  }
  return "Tap to allow microphone.";
}

export function getMicErrorMessage(
  code: MicErrorCode,
  platform: ClientPlatform,
): MicUserMessage {
  switch (code) {
    case "mic_permission_denied":
      if (platform.isIos) {
        return {
          title: "Microphone permission is off for Lexienn.",
          body: "Enable microphone access in Safari, then try again.",
          steps: platform.isStandalonePwa
            ? [...IOS_PWA_PERMISSION_STEPS, ...IOS_SAFARI_PERMISSION_STEPS]
            : IOS_SAFARI_PERMISSION_STEPS,
        };
      }
      return {
        title: "Microphone permission is off for Lexienn.",
        body: "Enable microphone access in your browser settings, then tap Try again.",
      };
    case "no_microphone_found":
      return {
        body: "No microphone was found on this device. You can continue typing.",
      };
    case "mic_in_use_or_unavailable":
      return {
        body: "The microphone is in use or unavailable. Close other apps using the mic and try again.",
      };
    case "audio_capture_failed":
      return {
        body: "Audio capture was interrupted. Try again or continue typing.",
      };
    case "insecure_context_or_policy_block":
      return {
        body: "Microphone access requires a secure HTTPS connection. Open Lexienn over HTTPS and try again.",
      };
    case "audio_constraints_failed":
      return {
        body: "This browser could not use the microphone with the requested settings. Try again or type manually.",
      };
    case "mic_not_supported":
      return {
        body: "Voice typing is not supported in this browser yet. You can type manually.",
      };
    case "speech_recognition_not_supported":
      return {
        body: "Voice typing is not supported in this browser yet. You can type manually.",
      };
    default:
      return {
        body: "Voice input failed. Try again or continue typing.",
      };
  }
}

export function micErrorCodeToVoiceInputState(
  code: MicErrorCode,
): "permission_denied" | "unsupported" | "speech_error" {
  if (code === "mic_permission_denied") return "permission_denied";
  if (
    code === "mic_not_supported" ||
    code === "speech_recognition_not_supported"
  ) {
    return "unsupported";
  }
  return "speech_error";
}
