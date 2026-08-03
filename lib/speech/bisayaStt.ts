/** Cebuano / Bisaya STT constraints — never open-ended auto-detect when selected. */

export const CEBUANO_BASE = "ceb";

export const BISAYA_STT_VOCABULARY = [
  "kumusta",
  "asa",
  "unsa",
  "ngano",
  "kanus-a",
  "pila",
  "palihog",
  "salamat",
  "maayo",
  "adto",
  "diri",
  "didto",
  "balay",
  "simbahan",
] as const;

export const BISAYA_BASE_PROMPT =
  "Transcribe in Cebuano/Bisaya. Preserve Cebuano words and spelling. Do not translate. Likely vocabulary: kumusta, asa, unsa, ngano, kanus-a, pila, palihog, salamat, maayo, adto, diri, didto, balay, simbahan.";

export const BISAYA_STRONG_RETRY_PROMPT =
  "CRITICAL: The speaker is using Cebuano/Bisaya (not Japanese, Arabic, Mandarin, or English). Transcribe ONLY Cebuano/Bisaya Latin orthography. Preserve Cebuano spelling. Do not translate. Do not invent Japanese or Arabic. Vocabulary: kumusta, asa, unsa, ngano, kanus-a, pila, palihog, salamat, maayo, adto, diri, didto, balay, simbahan, tabangi, doktor, gikinahanglan, padulong, kasabot, hinay-hinayi, pangalan, buntag.";

/** Provider languages allowed when expected language is Cebuano. */
export const CEBUANO_ALLOWED_PROVIDER_LANGUAGES = new Set([
  "ceb",
  "fil",
  "tl",
  "tgl",
  "en",
  "eng",
]);

export const BISAYA_CONFIRM_MESSAGE =
  "Please check the Bisaya transcript before translating.";

export const BISAYA_CONFIDENCE_THRESHOLD = 0.72;

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
