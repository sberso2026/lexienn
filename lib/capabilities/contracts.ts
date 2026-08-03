import {
  getLanguageOptionByValue,
  type LanguageOptionDefinition,
} from "@/lib/languages/languageOptions";
import { toLanguageCapabilityMetadata } from "@/lib/languages/languageCapabilities";
import { isLocalOcrAvailable } from "@/lib/ocr/localOcrClient";
import { isBrowserOnline } from "@/lib/ocr/ocrClient";
import {
  isAutomaticLanguageDetectionFlagEnabled,
  isConversationEnabled,
  isLiveLensOverlayEnabled,
  isVisualObjectUnderstandingEnabled,
} from "@/lib/config/featureFlags";

export type CapabilityState = "available" | "partial" | "unavailable" | "experimental";

export type LanguageCapabilities = {
  languageId: string;
  displayName: string;
  textTranslation: CapabilityState;
  dictionary: CapabilityState;
  voiceInput: CapabilityState;
  voiceOutput: CapabilityState;
  cameraOcr: CapabilityState;
  offlinePack: CapabilityState;
  isExperimental: boolean;
};

export type VoiceCapabilities = {
  browserSpeechRecognition: CapabilityState;
  serverStt: CapabilityState;
  automaticLanguageDetection: CapabilityState;
  voicePlayback: CapabilityState;
};

export type LensCapabilities = {
  cameraCapture: CapabilityState;
  imageImport: CapabilityState;
  cloudOcr: CapabilityState;
  localOcr: CapabilityState;
  liveOverlay: CapabilityState;
  visualObjectUnderstanding: CapabilityState;
  tapToDefine: CapabilityState;
};

export type OfflineCapabilities = {
  languageId: string;
  offlineTextPack: CapabilityState;
  offlinePhrasePack: CapabilityState;
  offlineAudioPack: CapabilityState;
  offlineOcrPack: CapabilityState;
  offlineDictionaryPack: CapabilityState;
  estimatedSizeLabel: string | null;
  version: string | null;
  lastUpdated: string | null;
  honestLimitations: string[];
};

export type ConversationCapabilities = {
  conversationMode: CapabilityState;
  bigScreen: CapabilityState;
  autoDetectPerSide: CapabilityState;
  transcriptSave: CapabilityState;
};

function flagCapability(value: boolean, experimental = false): CapabilityState {
  if (!value) return "unavailable";
  return experimental ? "experimental" : "available";
}

export function resolveLanguageCapabilities(
  languageId: string,
  option?: LanguageOptionDefinition | null,
): LanguageCapabilities {
  const resolved = option ?? getLanguageOptionByValue(languageId);
  if (!resolved) {
    return {
      languageId,
      displayName: languageId,
      textTranslation: "unavailable",
      dictionary: "unavailable",
      voiceInput: "unavailable",
      voiceOutput: "unavailable",
      cameraOcr: "unavailable",
      offlinePack: "unavailable",
      isExperimental: true,
    };
  }
  const meta = toLanguageCapabilityMetadata(resolved);
  return {
    languageId,
    displayName: meta.englishName,
    textTranslation: flagCapability(meta.supportsTextTranslation, meta.isExperimental),
    dictionary: flagCapability(meta.supportsDictionary, meta.isExperimental),
    voiceInput: flagCapability(meta.supportsVoiceInput, meta.isExperimental),
    voiceOutput: flagCapability(meta.supportsVoiceOutput, meta.isExperimental),
    cameraOcr: flagCapability(meta.supportsCameraOcr, meta.isExperimental),
    offlinePack: flagCapability(meta.supportsOfflinePack, meta.isExperimental),
    isExperimental: meta.isExperimental,
  };
}

export function resolveVoiceCapabilities(): VoiceCapabilities {
  const browserSpeech =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  return {
    browserSpeechRecognition: browserSpeech ? "partial" : "unavailable",
    serverStt: "available",
    automaticLanguageDetection: isAutomaticLanguageDetectionFlagEnabled()
      ? "available"
      : "unavailable",
    voicePlayback: "partial",
  };
}

export function resolveLensCapabilities(): LensCapabilities {
  const online = typeof window === "undefined" ? true : isBrowserOnline();
  const localOcr = typeof window === "undefined" ? false : isLocalOcrAvailable();
  return {
    cameraCapture: "available",
    imageImport: "available",
    cloudOcr: online ? "available" : "unavailable",
    localOcr: localOcr ? "available" : "unavailable",
    liveOverlay: isLiveLensOverlayEnabled() ? "experimental" : "unavailable",
    visualObjectUnderstanding: isVisualObjectUnderstandingEnabled()
      ? "experimental"
      : "unavailable",
    tapToDefine: "available",
  };
}

export function resolveConversationCapabilities(): ConversationCapabilities {
  const enabled = isConversationEnabled();
  return {
    conversationMode: enabled ? "available" : "unavailable",
    bigScreen: enabled ? "available" : "unavailable",
    autoDetectPerSide:
      enabled && isAutomaticLanguageDetectionFlagEnabled() ? "available" : "unavailable",
    transcriptSave: enabled ? "available" : "unavailable",
  };
}

export const OFFLINE_RESOLUTION_ORDER = [
  "exact curated offline result",
  "personal glossary",
  "downloaded local dictionary/phrase data",
  "local OCR or speech model where available",
  "cloud AI when online",
  "safe unavailable",
] as const;
