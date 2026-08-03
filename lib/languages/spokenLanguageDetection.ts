import {
  getAllLanguageOptions,
  getLanguageOptionByValue,
  type LanguageOptionDefinition,
} from "@/lib/languages/languageOptions";
import { isMaoriLanguageCode } from "@/lib/languages/nationalLanguages";

export const AUTO_DETECT_LANGUAGE = "auto";
export const AUTO_DETECT_LABEL = "Auto Detect";

/** High confidence: auto-update From. */
export const SPOKEN_LANG_HIGH_CONFIDENCE = 0.75;
/** Medium confidence: ask for confirmation. */
export const SPOKEN_LANG_MEDIUM_CONFIDENCE = 0.45;

export type SpokenLanguageDetectionSource = "browser" | "server_stt";

export type SpokenLanguageDetectionResult = {
  transcript: string;
  detectedLanguageCode: string | null;
  detectedLanguageName: string | null;
  confidence: number | null;
  source: SpokenLanguageDetectionSource;
  durationMs: number;
};

export type SpokenLanguageDetectionAction =
  | "apply"
  | "confirm"
  | "keep_auto"
  | "unsupported";

export type SpokenLanguageDetectionDecision = {
  action: SpokenLanguageDetectionAction;
  catalogValue: string | null;
  displayName: string | null;
  message: string;
};

/** Provider / Whisper language codes → Lexienn selection values. */
const PROVIDER_LANGUAGE_MAP: Record<string, string> = {
  en: "en",
  eng: "en",
  mi: "mi",
  mao: "mi",
  mri: "mi",
  tl: "tl",
  fil: "tl",
  tgl: "tl",
  ceb: "ceb",
  hil: "hil",
  ilo: "ilo",
  war: "war",
  id: "id",
  ms: "ms",
  es: "es",
  spa: "es",
  fr: "fr",
  fra: "fr",
  de: "de",
  deu: "de",
  pt: "pt",
  por: "pt",
  it: "it",
  ita: "it",
  nl: "nl",
  ru: "ru",
  rus: "ru",
  ar: "ar",
  ara: "ar",
  hi: "hi",
  hin: "hi",
  bn: "bn",
  ja: "ja",
  jpn: "ja",
  ko: "ko",
  kor: "ko",
  zh: "zh",
  zho: "zh",
  yue: "yue",
  vi: "vi",
  vie: "vi",
  th: "th",
  tha: "th",
  lo: "lo",
  lao: "lo",
  sw: "sw",
  swa: "sw",
  am: "am",
  amh: "am",
  yo: "yo",
  yor: "yo",
  zu: "zu",
  zul: "zu",
  ha: "ha",
  hau: "ha",
  tr: "tr",
  tur: "tr",
  pl: "pl",
  pol: "pl",
  ga: "ga",
  gle: "ga",
  fa: "fa",
  fas: "fa",
  he: "he",
  heb: "he",
  ur: "ur",
  urd: "ur",
};

export function isAutoDetectLanguage(value: string | null | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === AUTO_DETECT_LANGUAGE;
}

export function mapProviderLanguageToCatalog(
  providerCode: string | null | undefined,
): LanguageOptionDefinition | null {
  if (!providerCode?.trim()) return null;
  const normalized = providerCode.trim().toLowerCase().replace("_", "-");
  const base = normalized.split("-")[0] ?? normalized;

  if (isMaoriLanguageCode(normalized) || base === "mi" || base === "mao" || base === "mri") {
    return getLanguageOptionByValue("mi") ?? null;
  }

  const mapped = PROVIDER_LANGUAGE_MAP[normalized] ?? PROVIDER_LANGUAGE_MAP[base];
  if (mapped) {
    return getLanguageOptionByValue(mapped) ?? null;
  }

  const exact = getAllLanguageOptions().find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.iso_639_code.toLowerCase() === base ||
      option.base_language.toLowerCase() === base ||
      option.bcp_47_tag.toLowerCase() === normalized,
  );
  return exact ?? null;
}

export function decideSpokenLanguageDetection(
  result: Pick<SpokenLanguageDetectionResult, "detectedLanguageCode" | "confidence">,
): SpokenLanguageDetectionDecision {
  const catalog = mapProviderLanguageToCatalog(result.detectedLanguageCode);
  if (!catalog) {
    return {
      action: "unsupported",
      catalogValue: null,
      displayName: null,
      message: "Language could not be detected reliably. Select it manually.",
    };
  }

  const confidence = result.confidence;
  if (confidence == null || Number.isNaN(confidence)) {
    return {
      action: "confirm",
      catalogValue: catalog.value,
      displayName: catalog.display_name,
      message: `We detected ${catalog.display_name}. Use this language?`,
    };
  }

  if (confidence >= SPOKEN_LANG_HIGH_CONFIDENCE) {
    return {
      action: "apply",
      catalogValue: catalog.value,
      displayName: catalog.display_name,
      message: `Detected: ${catalog.display_name}`,
    };
  }

  if (confidence >= SPOKEN_LANG_MEDIUM_CONFIDENCE) {
    return {
      action: "confirm",
      catalogValue: catalog.value,
      displayName: catalog.display_name,
      message: `We detected ${catalog.display_name}. Use this language?`,
    };
  }

  return {
    action: "keep_auto",
    catalogValue: null,
    displayName: catalog.display_name,
    message: "Language could not be detected reliably. Select it manually.",
  };
}

export function buildSpokenLanguageDetectionResult(input: {
  transcript: string;
  providerLanguage?: string | null;
  confidence?: number | null;
  source: SpokenLanguageDetectionSource;
  durationMs?: number;
}): SpokenLanguageDetectionResult {
  const catalog = mapProviderLanguageToCatalog(input.providerLanguage);
  return {
    transcript: input.transcript,
    detectedLanguageCode: catalog?.value ?? null,
    detectedLanguageName: catalog?.display_name ?? null,
    confidence: input.confidence ?? null,
    source: input.source,
    durationMs: input.durationMs ?? 0,
  };
}
