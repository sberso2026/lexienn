import type { LanguageOptionDefinition } from "@/lib/languages/languageOptions";
import {
  LOCAL_DIALECTS_GROUP,
  NATIONAL_LANGUAGES_GROUP,
  resolveSelectorGroup,
} from "@/lib/languages/languageGrouping";
import { isRtlLanguageCode } from "@/lib/languages/languageDirection";
import { mapSpeechRecognitionLocale } from "@/lib/speech/speechRecognitionLocale";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

export type LanguageCapabilityMetadata = {
  id: string;
  englishName: string;
  nativeName: string;
  aliases: string[];
  group: "national_language" | "local_dialect";
  selectorGroupLabel: typeof NATIONAL_LANGUAGES_GROUP | typeof LOCAL_DIALECTS_GROUP;
  region: string;
  script: string;
  direction: "ltr" | "rtl";
  speechRecognitionLocale: string;
  voiceOutputLocale: string;
  supportsTextTranslation: boolean;
  supportsDictionary: boolean;
  supportsVoiceInput: boolean;
  supportsVoiceOutput: boolean;
  supportsOfflinePack: boolean;
  supportsCameraOcr: boolean;
  isExperimental: boolean;
};

function inferScript(code: string, nativeName: string): string {
  if (isRtlLanguageCode(code)) return "Arabic/Hebrew";
  if (/[\u0400-\u04FF]/.test(nativeName)) return "Cyrillic";
  if (/[\u0370-\u03FF]/.test(nativeName)) return "Greek";
  if (/[\u4E00-\u9FFF]/.test(nativeName)) return "Han";
  if (/[\u3040-\u30FF]/.test(nativeName)) return "Japanese";
  if (/[\uAC00-\uD7AF]/.test(nativeName)) return "Hangul";
  return "Latin";
}

export function toLanguageCapabilityMetadata(
  option: LanguageOptionDefinition,
  aliases: string[] = [],
): LanguageCapabilityMetadata {
  const selectorGroupLabel = resolveSelectorGroup({
    value: option.value,
    base_language: option.base_language,
    dialect_variant: option.dialect_variant,
  });
  const voiceSupported = option.supports_voice && option.supports_speech_input !== false;
  return {
    id: option.value,
    englishName: option.display_name,
    nativeName: option.native_name,
    aliases,
    group:
      selectorGroupLabel === LOCAL_DIALECTS_GROUP ? "local_dialect" : "national_language",
    selectorGroupLabel,
    region: option.country_or_regions,
    script: inferScript(option.base_language, option.native_name),
    direction: isRtlLanguageCode(option.base_language) ? "rtl" : "ltr",
    speechRecognitionLocale: mapSpeechRecognitionLocale(option.base_language),
    voiceOutputLocale: option.locale_tag || getBcp47Lang(option.base_language),
    supportsTextTranslation: option.supports_translation,
    supportsDictionary: option.supports_translation,
    supportsVoiceInput: voiceSupported,
    supportsVoiceOutput: option.supports_voice,
    supportsOfflinePack: option.supports_offline_pack,
    supportsCameraOcr: option.supports_ocr ?? true,
    isExperimental: Boolean(option.dialect_variant) && !option.supports_offline_pack,
  };
}

export function voiceUnavailableMessage(englishName: string): string {
  return `Voice is not available yet for ${englishName}.`;
}

export function offlinePackUnavailableMessage(): string {
  return "Offline pack not available yet.";
}
