import { mapSpeechRecognitionLocale } from "@/lib/speech/speechRecognitionLocale";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

/** Dialects without a reliable dedicated browser STT locale. */
const SERVER_AUTO_DETECT_BASES = new Set([
  "ceb",
  "hil",
  "ilo",
  "war",
  "bli",
  "pam",
  "pag",
  "bcl",
  "cbk",
]);

export type SpeechCaptureLanguagePlan = {
  selectedLanguage: string;
  resolvedBrowserLocale: string;
  /** Whisper language code, or undefined to omit (= auto-detect). */
  whisperLanguageHint: string | undefined;
  preferRecordedTranscription: boolean;
  reason: string;
};

function baseCode(languageHint: string): string {
  return languageHint.trim().toLowerCase().split("::")[0]?.split("-")[0] ?? "";
}

/**
 * Resolve STT locales for the active speaker only.
 * Unsupported browser locales must not hard-fail — prefer server auto-detect.
 */
export function resolveSpeechCaptureLanguagePlan(
  languageHint: string,
): SpeechCaptureLanguagePlan {
  const selectedLanguage = languageHint.trim() || "auto";
  const base = baseCode(selectedLanguage);

  if (!base || base === "auto") {
    return {
      selectedLanguage,
      resolvedBrowserLocale: "en-US",
      whisperLanguageHint: undefined,
      preferRecordedTranscription: true,
      reason: "auto_detect",
    };
  }

  const resolvedBrowserLocale = mapSpeechRecognitionLocale(selectedLanguage);
  const needsServerAuto = SERVER_AUTO_DETECT_BASES.has(base);

  if (needsServerAuto) {
    return {
      selectedLanguage,
      resolvedBrowserLocale,
      whisperLanguageHint: undefined,
      preferRecordedTranscription: true,
      reason: "dialect_server_auto",
    };
  }

  const whisperBase = base;
  return {
    selectedLanguage,
    resolvedBrowserLocale,
    whisperLanguageHint: whisperBase,
    preferRecordedTranscription: false,
    reason: "exact_or_mapped_locale",
  };
}

export function isBrowserSpeechLocaleLikelyUnsupported(languageHint: string): boolean {
  const base = baseCode(languageHint);
  if (!base || base === "auto") return true;
  if (SERVER_AUTO_DETECT_BASES.has(base)) return true;
  const locale = mapSpeechRecognitionLocale(languageHint);
  const mapped = getBcp47Lang(base);
  return locale === mapped && SERVER_AUTO_DETECT_BASES.has(base);
}
