import { mapSpeechRecognitionLocale } from "@/lib/speech/speechRecognitionLocale";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";
import { isCebuanoLanguageHint, CEBUANO_BASE } from "@/lib/speech/bisayaStt";

/** Dialects that prefer server STT (recorded) over weak browser recognition. */
const SERVER_PREFERRED_DIALECT_BASES = new Set([
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
  /**
   * Language hint sent to server STT.
   * For Cebuano this is always `ceb` (constrained) — never open `auto`.
   * Undefined only for true Auto Detect.
   */
  whisperLanguageHint: string | undefined;
  preferRecordedTranscription: boolean;
  reason: string;
  expectedLanguage?: string;
};

function baseCode(languageHint: string): string {
  return languageHint.trim().toLowerCase().split("::")[0]?.split("-")[0] ?? "";
}

/**
 * Resolve STT locales for the active speaker only.
 * Cebuano/Bisaya uses constrained expected language `ceb` (not open auto-detect).
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
      expectedLanguage: "auto",
    };
  }

  const resolvedBrowserLocale = mapSpeechRecognitionLocale(selectedLanguage);

  if (isCebuanoLanguageHint(selectedLanguage)) {
    return {
      selectedLanguage,
      resolvedBrowserLocale,
      whisperLanguageHint: CEBUANO_BASE,
      preferRecordedTranscription: true,
      reason: "cebuano_constrained",
      expectedLanguage: CEBUANO_BASE,
    };
  }

  if (SERVER_PREFERRED_DIALECT_BASES.has(base)) {
    return {
      selectedLanguage,
      resolvedBrowserLocale,
      whisperLanguageHint: base,
      preferRecordedTranscription: true,
      reason: "dialect_server_preferred",
      expectedLanguage: base,
    };
  }

  return {
    selectedLanguage,
    resolvedBrowserLocale,
    whisperLanguageHint: base,
    preferRecordedTranscription: false,
    reason: "exact_or_mapped_locale",
    expectedLanguage: base,
  };
}

export function isBrowserSpeechLocaleLikelyUnsupported(languageHint: string): boolean {
  const base = baseCode(languageHint);
  if (!base || base === "auto") return true;
  if (SERVER_PREFERRED_DIALECT_BASES.has(base)) return true;
  if (isCebuanoLanguageHint(languageHint)) return true;
  const locale = mapSpeechRecognitionLocale(languageHint);
  const mapped = getBcp47Lang(base);
  return locale === mapped && SERVER_PREFERRED_DIALECT_BASES.has(base);
}
