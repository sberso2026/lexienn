/** Cebuano / Bisaya STT constraints — never open-ended auto-detect when selected. */

export const CEBUANO_BASE = "ceb";

export const BISAYA_STT_VOCABULARY = [
  "amping",
  "kumusta",
  "unsa",
  "asa",
  "ngano",
  "kanus-a",
  "palihog",
  "salamat",
  "maayo",
  "diri",
  "didto",
  "balay",
  "simbahan",
  "padulong",
  "kasabot",
  "hinay-hinayi",
  "pila",
  "adto",
  "tabangi",
  "kanunay",
] as const;

export const BISAYA_BASE_PROMPT =
  "Transcribe exactly in Cebuano/Bisaya. Do not translate. Do not output English phonetic guesses. Preserve Cebuano spelling. Common words include: amping, kumusta, unsa, asa, ngano, kanus-a, palihog, salamat, maayo, diri, didto, balay, simbahan, padulong, kasabot, hinay-hinayi.";

export const BISAYA_STRONG_RETRY_PROMPT =
  "CRITICAL RETRY: Speaker is Cebuano/Bisaya only. Output Latin Cebuano orthography only. Do not translate. Do not output English phonetic guesses like I'm ping or I'm bing. Do not output Arabic, Japanese, Chinese, Hebrew, or Cyrillic. Preserve Cebuano spelling. Words: amping, pag-amping, amping mo, amping kanunay, kumusta, unsa, asa, ngano, kanus-a, palihog, salamat, maayo, diri, didto, balay, simbahan, padulong, kasabot, hinay-hinayi, tabangi, doktor.";

/** Provider languages allowed when expected language is Cebuano (metadata only). */
export const CEBUANO_ALLOWED_PROVIDER_LANGUAGES = new Set([
  "ceb",
  "fil",
  "tl",
  "tgl",
  "en",
  "eng",
]);

export const BISAYA_CONFIRM_MESSAGE =
  "We may not have heard this Bisaya phrase correctly.";

export const BISAYA_CONFIDENCE_THRESHOLD = 0.72;
export const BISAYA_LEXICAL_SCORE_THRESHOLD = 0.28;

/** Minimum usable clip length for Cebuano STT. */
export const BISAYA_MIN_AUDIO_DURATION_MS = 450;
export const BISAYA_MIN_AUDIO_BYTES = 800;

export function isCebuanoLanguageHint(languageHint: string): boolean {
  const base =
    languageHint.trim().toLowerCase().split("::")[0]?.split("-")[0] ?? "";
  return base === CEBUANO_BASE || base === "bisaya" || base.includes("bisaya");
}

export function normalizeProviderLanguageCode(
  code: string | null | undefined,
): string {
  if (!code) return "";
  return code.trim().toLowerCase().split(/[-_]/)[0] ?? "";
}
