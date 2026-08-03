import {
  BISAYA_CONFIDENCE_THRESHOLD,
  CEBUANO_ALLOWED_PROVIDER_LANGUAGES,
  isCebuanoLanguageHint,
  normalizeProviderLanguageCode,
} from "@/lib/speech/bisayaStt";

/** Hiragana, Katakana, CJK ideographs commonly returned for mistaken Japanese. */
const JAPANESE_SCRIPT_RE =
  /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** Arabic script (incl. presentation forms). */
const ARABIC_SCRIPT_RE =
  /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;

export type BisayaTranscriptValidation = {
  ok: boolean;
  needsConfirmation: boolean;
  confidence: number;
  reason: string;
  rejectedScript: "japanese" | "arabic" | null;
  rejectedProviderLanguage: string | null;
};

export function containsJapaneseScript(text: string): boolean {
  return JAPANESE_SCRIPT_RE.test(text);
}

export function containsArabicScript(text: string): boolean {
  return ARABIC_SCRIPT_RE.test(text);
}

export function isProviderLanguageAllowedForCebuano(
  providerLanguage: string | null | undefined,
): boolean {
  const code = normalizeProviderLanguageCode(providerLanguage);
  if (!code) return true; // missing → rely on script + confidence
  return CEBUANO_ALLOWED_PROVIDER_LANGUAGES.has(code);
}

/**
 * Validate a transcript when the user selected Cebuano/Bisaya.
 * Rejects Japanese/Arabic script and out-of-set provider languages.
 */
export function validateBisayaTranscript(options: {
  transcript: string;
  expectedLanguage: string;
  providerLanguage?: string | null;
  confidence?: number | null;
}): BisayaTranscriptValidation {
  if (!isCebuanoLanguageHint(options.expectedLanguage)) {
    return {
      ok: true,
      needsConfirmation: false,
      confidence: options.confidence ?? 0.85,
      reason: "not_cebuano_expected",
      rejectedScript: null,
      rejectedProviderLanguage: null,
    };
  }

  const transcript = options.transcript.trim();
  const confidence = options.confidence ?? 0.85;

  if (!transcript) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: 0,
      reason: "empty_transcript",
      rejectedScript: null,
      rejectedProviderLanguage: null,
    };
  }

  if (containsJapaneseScript(transcript)) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.2),
      reason: "japanese_script_rejected",
      rejectedScript: "japanese",
      rejectedProviderLanguage: null,
    };
  }

  if (containsArabicScript(transcript)) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.2),
      reason: "arabic_script_rejected",
      rejectedScript: "arabic",
      rejectedProviderLanguage: null,
    };
  }

  const providerCode = normalizeProviderLanguageCode(options.providerLanguage);
  if (providerCode && !isProviderLanguageAllowedForCebuano(providerCode)) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.25),
      reason: "provider_language_rejected",
      rejectedScript: null,
      rejectedProviderLanguage: providerCode,
    };
  }

  if (confidence < BISAYA_CONFIDENCE_THRESHOLD) {
    return {
      ok: true,
      needsConfirmation: true,
      confidence,
      reason: "low_confidence",
      rejectedScript: null,
      rejectedProviderLanguage: null,
    };
  }

  return {
    ok: true,
    needsConfirmation: false,
    confidence,
    reason: "accepted",
    rejectedScript: null,
    rejectedProviderLanguage: null,
  };
}
