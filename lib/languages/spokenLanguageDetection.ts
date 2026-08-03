import {
  getAllLanguageOptions,
  getLanguageOptionByValue,
  type LanguageOptionDefinition,
} from "@/lib/languages/languageOptions";
import { isMaoriLanguageCode } from "@/lib/languages/nationalLanguages";
import { inferSpokenLanguageFromTranscript as inferFromLocal } from "@/lib/languages/localLanguageDetector";
import type { DetectionStage } from "@/lib/languages/languageDetectionTypes";

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
  secondaryLanguageCode?: string | null;
  secondaryLanguageName?: string | null;
  confidence: number | null;
  source: SpokenLanguageDetectionSource;
  durationMs: number;
  detectionStage?: DetectionStage;
  detectionTimeMs?: number;
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
  secondaryCatalogValue?: string | null;
  secondaryDisplayName?: string | null;
  message: string;
};

/** Provider / Whisper language codes → Lexienn selection values. */
const PROVIDER_LANGUAGE_MAP: Record<string, string> = {
  en: "en",
  eng: "en",
  english: "en",
  mi: "mi",
  mao: "mi",
  mri: "mi",
  tl: "tl",
  fil: "tl",
  tgl: "tl",
  filipino: "tl",
  tagalog: "tl",
  ceb: "ceb",
  cebuano: "ceb",
  bisaya: "ceb",
  hil: "hil",
  ilo: "ilo",
  war: "war",
  id: "id",
  ms: "ms",
  es: "es",
  spa: "es",
  spanish: "es",
  fr: "fr",
  fra: "fr",
  french: "fr",
  de: "de",
  deu: "de",
  german: "de",
  pt: "pt",
  por: "pt",
  portuguese: "pt",
  it: "it",
  ita: "it",
  italian: "it",
  nl: "nl",
  ru: "ru",
  rus: "ru",
  ar: "ar",
  ara: "ar",
  arabic: "ar",
  hi: "hi",
  hin: "hi",
  bn: "bn",
  ja: "ja",
  jpn: "ja",
  japanese: "ja",
  ko: "ko",
  kor: "ko",
  korean: "ko",
  zh: "zh",
  zho: "zh",
  cmn: "zh",
  chinese: "zh",
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

/** @deprecated Prefer detectLanguageLocal / detectLanguagePipeline (Batch 52A). */
export function inferSpokenLanguageFromTranscript(transcript: string): {
  code: string | null;
  confidence: number;
  secondaryCode?: string | null;
} {
  return inferFromLocal(transcript);
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
      option.bcp_47_tag.toLowerCase() === normalized ||
      option.display_name.toLowerCase() === normalized ||
      option.display_name.toLowerCase().startsWith(`${normalized} `) ||
      option.display_name.toLowerCase().includes(` / ${normalized}`),
  );
  return exact ?? null;
}

export function decideSpokenLanguageDetection(
  result: Pick<
    SpokenLanguageDetectionResult,
    | "detectedLanguageCode"
    | "confidence"
    | "secondaryLanguageCode"
    | "detectionStage"
  >,
): SpokenLanguageDetectionDecision {
  const catalog = mapProviderLanguageToCatalog(result.detectedLanguageCode);
  const secondaryCatalog = mapProviderLanguageToCatalog(
    result.secondaryLanguageCode,
  );

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
      secondaryCatalogValue: secondaryCatalog?.value ?? null,
      secondaryDisplayName: secondaryCatalog?.display_name ?? null,
      message: `We detected ${catalog.display_name}. Use this language?`,
    };
  }

  if (confidence >= SPOKEN_LANG_HIGH_CONFIDENCE) {
    const secondaryNote = secondaryCatalog
      ? ` (also ${secondaryCatalog.display_name})`
      : "";
    return {
      action: "apply",
      catalogValue: catalog.value,
      displayName: catalog.display_name,
      secondaryCatalogValue: secondaryCatalog?.value ?? null,
      secondaryDisplayName: secondaryCatalog?.display_name ?? null,
      message: `Detected: ${catalog.display_name}${secondaryNote}`,
    };
  }

  if (confidence >= SPOKEN_LANG_MEDIUM_CONFIDENCE) {
    return {
      action: "confirm",
      catalogValue: catalog.value,
      displayName: catalog.display_name,
      secondaryCatalogValue: secondaryCatalog?.value ?? null,
      secondaryDisplayName: secondaryCatalog?.display_name ?? null,
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
  secondaryLanguage?: string | null;
  detectionStage?: DetectionStage;
  detectionTimeMs?: number;
}): SpokenLanguageDetectionResult {
  let providerLanguage = input.providerLanguage ?? null;
  let confidence = input.confidence ?? null;
  let secondaryLanguage = input.secondaryLanguage ?? null;
  let detectionStage = input.detectionStage;

  if (!providerLanguage?.trim()) {
    const inferred = inferFromLocal(input.transcript);
    if (inferred.code) {
      providerLanguage = inferred.code;
      confidence = confidence ?? inferred.confidence;
      secondaryLanguage = secondaryLanguage ?? inferred.secondaryCode ?? null;
      detectionStage = detectionStage ?? "local";
    }
  } else {
    // Even with a provider code, enrich secondary via local mixed-language detection.
    const inferred = inferFromLocal(input.transcript);
    if (!secondaryLanguage && inferred.secondaryCode) {
      secondaryLanguage = inferred.secondaryCode;
    }
    // Prefer strong local phrase/script hits over a weak/missing provider confidence.
    if (
      inferred.code &&
      inferred.confidence >= 0.95 &&
      (!confidence || confidence < inferred.confidence)
    ) {
      providerLanguage = inferred.code;
      confidence = inferred.confidence;
      detectionStage = "local";
    }
  }

  const catalog = mapProviderLanguageToCatalog(providerLanguage);
  const secondaryCatalog = mapProviderLanguageToCatalog(secondaryLanguage);
  return {
    transcript: input.transcript,
    detectedLanguageCode: catalog?.value ?? null,
    detectedLanguageName: catalog?.display_name ?? null,
    secondaryLanguageCode: secondaryCatalog?.value ?? null,
    secondaryLanguageName: secondaryCatalog?.display_name ?? null,
    confidence,
    source: input.source,
    durationMs: input.durationMs ?? 0,
    detectionStage,
    detectionTimeMs: input.detectionTimeMs ?? input.durationMs ?? 0,
  };
}
