import {
  BISAYA_CONFIDENCE_THRESHOLD,
  BISAYA_LEXICAL_SCORE_THRESHOLD,
  CEBUANO_ALLOWED_PROVIDER_LANGUAGES,
  isCebuanoLanguageHint,
  normalizeProviderLanguageCode,
} from "@/lib/speech/bisayaStt";
import { scoreCebuanoLexicalOverlap } from "@/lib/speech/bisayaLexiconCorrection";

/** Hiragana, Katakana, CJK. */
const JAPANESE_OR_CJK_RE =
  /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** Arabic script. */
const ARABIC_SCRIPT_RE =
  /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;

/** Hebrew. */
const HEBREW_SCRIPT_RE = /[\u0590-\u05ff]/;

/** Cyrillic. */
const CYRILLIC_SCRIPT_RE = /[\u0400-\u04ff]/;

/** Letters that are not basic Latin (used for “mostly non-Latin” gate). */
const NON_LATIN_LETTER_RE =
  /[^\u0000-\u007f\u00c0-\u024f\u1e00-\u1effA-Za-z]/u;
const LATIN_LETTER_RE = /[A-Za-zÀ-ÿ]/;

export type RejectedScript =
  | "japanese"
  | "chinese"
  | "arabic"
  | "hebrew"
  | "cyrillic"
  | "non_latin"
  | null;

export type BisayaTranscriptValidation = {
  ok: boolean;
  needsConfirmation: boolean;
  confidence: number;
  reason: string;
  rejectedScript: RejectedScript;
  rejectedProviderLanguage: string | null;
  lexicalScore: number;
};

export function containsJapaneseScript(text: string): boolean {
  return /[\u3040-\u30ff\u31f0-\u31ff]/.test(text);
}

export function containsChineseScript(text: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);
}

export function containsArabicScript(text: string): boolean {
  return ARABIC_SCRIPT_RE.test(text);
}

export function containsHebrewScript(text: string): boolean {
  return HEBREW_SCRIPT_RE.test(text);
}

export function containsCyrillicScript(text: string): boolean {
  return CYRILLIC_SCRIPT_RE.test(text);
}

export function detectRejectedScript(text: string): RejectedScript {
  if (containsJapaneseScript(text) || JAPANESE_OR_CJK_RE.test(text) && /[\u3040-\u30ff]/.test(text)) {
    return "japanese";
  }
  if (containsChineseScript(text)) return "chinese";
  if (containsArabicScript(text)) return "arabic";
  if (containsHebrewScript(text)) return "hebrew";
  if (containsCyrillicScript(text)) return "cyrillic";
  return null;
}

/** True when letter characters are mostly non-Latin. */
export function isMostlyNonLatinScript(text: string): boolean {
  const letters = text.replace(/\s+/g, "");
  if (!letters) return false;
  let latin = 0;
  let nonLatin = 0;
  for (const ch of letters) {
    if (LATIN_LETTER_RE.test(ch)) latin += 1;
    else if (NON_LATIN_LETTER_RE.test(ch) && /\p{L}/u.test(ch)) nonLatin += 1;
  }
  const total = latin + nonLatin;
  if (total === 0) return false;
  return nonLatin / total >= 0.4;
}

export function isProviderLanguageAllowedForCebuano(
  providerLanguage: string | null | undefined,
): boolean {
  const code = normalizeProviderLanguageCode(providerLanguage);
  if (!code) return true;
  return CEBUANO_ALLOWED_PROVIDER_LANGUAGES.has(code);
}

/**
 * Validate a transcript when the user selected Cebuano/Bisaya.
 * Rejects foreign scripts; low lexical score requires confirmation.
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
      lexicalScore: 1,
    };
  }

  const transcript = options.transcript.trim();
  const confidence = options.confidence ?? 0.85;
  const lexicalScore = scoreCebuanoLexicalOverlap(transcript);

  if (!transcript) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: 0,
      reason: "empty_transcript",
      rejectedScript: null,
      rejectedProviderLanguage: null,
      lexicalScore: 0,
    };
  }

  const rejectedScript = detectRejectedScript(transcript);
  if (rejectedScript) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.15),
      reason: `${rejectedScript}_script_rejected`,
      rejectedScript,
      rejectedProviderLanguage: null,
      lexicalScore,
    };
  }

  if (isMostlyNonLatinScript(transcript)) {
    return {
      ok: false,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.15),
      reason: "mostly_non_latin_rejected",
      rejectedScript: "non_latin",
      rejectedProviderLanguage: null,
      lexicalScore,
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
      lexicalScore,
    };
  }

  if (lexicalScore < BISAYA_LEXICAL_SCORE_THRESHOLD) {
    return {
      ok: true,
      needsConfirmation: true,
      confidence: Math.min(confidence, 0.55),
      reason: "low_cebuano_lexical_score",
      rejectedScript: null,
      rejectedProviderLanguage: null,
      lexicalScore,
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
      lexicalScore,
    };
  }

  return {
    ok: true,
    needsConfirmation: false,
    confidence,
    reason: "accepted",
    rejectedScript: null,
    rejectedProviderLanguage: null,
    lexicalScore,
  };
}
