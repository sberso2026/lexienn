import { cleanTextForSpeech } from "@/lib/audio/speechText";
import { getLanguageByCode } from "@/lib/mock";
import { mockPhrasePacks } from "@/lib/mock/phrase-packs";
import type { OfflinePhrase, OfflinePhrasePack } from "@/lib/schemas";
import {
  isAiTranslationConfigured,
  translateSentenceWithAi,
} from "@/lib/translator/aiTranslationService";
import { tryBlaanVerifiedTranslation } from "@/lib/translator/blaanVerifiedTranslation";
import { tryDictionaryTranslation } from "@/lib/translator/dictionaryTranslation";
import { tryRuleFallbackTranslation } from "@/lib/translator/ruleFallback";
import { isBlaanTarget } from "@/lib/languages/philippineIndigenousLanguages";
import { findPhraseInPacks } from "@/lib/translator/translationFallbacks";
import { isAustralianEnglishTarget } from "@/lib/languages/languageOptions";
import { buildCautionNote, isEnglishLanguage } from "@/lib/translator/translationShared";
import {
  AI_NOT_CONFIGURED_MESSAGE,
  coerceTranslatorResponse,
  getReliabilityLabel,
  TRANSLATION_UNAVAILABLE_MESSAGE,
  type TranslationMode,
  type TranslatorProviderStatus,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

function getPacksForTargetLanguage(targetLanguage: string): OfflinePhrasePack[] {
  const language = getLanguageByCode(targetLanguage);
  if (!language) return [];
  return mockPhrasePacks.filter((pack) => pack.language_id === language.id);
}

function applyEnglishMode(text: string, mode: TranslationMode): string {
  let next = text.trim();

  if (mode === "polite" && !/\bplease\b/i.test(next)) {
    const lower = next.charAt(0).toLowerCase() + next.slice(1);
    next = `Please, ${lower}`;
  }

  if (mode === "simple") {
    next = next
      .replace(/\butilize\b/gi, "use")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bassistance\b/gi, "help");
  }

  if (mode === "speak_to_local") {
    next = next.replace(/[.!?]+$/g, "").trim();
  }

  return next;
}

function buildResponseFromPhrase(
  request: TranslatorRequest,
  phrase: OfflinePhrase,
  options?: { usageNote?: string; confidenceScore?: number },
): TranslatorResponse | null {
  const translated = cleanTextForSpeech(phrase.target_text);
  const confidence = options?.confidenceScore ?? phrase.confidence.score;

  return coerceTranslatorResponse({
    original_text: request.input_text.trim(),
    translated_text: translated,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect ?? phrase.dialect_id,
    natural_translation: translated,
    pronunciation_simple: phrase.pronunciation_simple,
    usage_note: options?.usageNote ?? "Exact phrase pack match.",
    confidence_score: confidence,
    validation_status: phrase.validation_status,
    source: "phrase_pack",
    reliability_label: getReliabilityLabel("phrase_pack", confidence),
    caution_note: buildCautionNote(request),
  });
}

function resolveEnglishToEnglish(request: TranslatorRequest): TranslatorResponse {
  const rewritten = applyEnglishMode(request.input_text, request.translation_mode);

  return (
    coerceTranslatorResponse({
      original_text: request.input_text.trim(),
      translated_text: rewritten,
      source_language: request.source_language,
      target_language: request.target_language,
      target_dialect: request.target_dialect,
      natural_translation: rewritten,
      pronunciation_simple: rewritten,
      usage_note: "Source and target language are both English.",
      confidence_score: 0.95,
      validation_status: "verified_dictionary",
      source: "dictionary",
      reliability_label: "Same language — no foreign translation applied",
      caution_note: buildCautionNote(request),
    }) ?? buildUnavailableResponse(request, { aiAttempted: false })
  );
}

function tryExactPhrasePack(request: TranslatorRequest): TranslatorResponse | null {
  const packs = getPacksForTargetLanguage(request.target_language);
  if (packs.length === 0) return null;

  const phrase = findPhraseInPacks(packs, request.input_text, request);
  if (!phrase) return null;

  return buildResponseFromPhrase(request, phrase);
}

function buildProviderStatus(request: TranslatorRequest): TranslatorProviderStatus {
  return {
    ai_configured: isAiTranslationConfigured(),
    ai_translation_enabled: request.ai_translation_enabled,
    rule_fallback_enabled: request.rule_fallback_enabled,
  };
}

function buildUnavailableResponse(
  request: TranslatorRequest,
  options: {
    aiAttempted: boolean;
    diagnostics?: string;
    reason?: string;
  },
): TranslatorResponse {
  const providerStatus = buildProviderStatus(request);
  const aiConfigured = providerStatus.ai_configured;
  const aiEnabled = request.ai_translation_enabled;

  let reason = options.reason ?? TRANSLATION_UNAVAILABLE_MESSAGE;

  if (!options.reason) {
    if (!aiConfigured && aiEnabled) {
      reason = AI_NOT_CONFIGURED_MESSAGE;
    } else if (aiConfigured && aiEnabled && options.aiAttempted) {
      reason =
        "Translation unavailable from reliable sources. AI translation timed out or did not return a valid result.";
    } else if (!request.rule_fallback_enabled && !aiEnabled) {
      reason =
        "Translation unavailable. Adjust translation options in Settings.";
    }
  }

  const includeDiagnostics =
    request.include_diagnostics || process.env.NODE_ENV === "development";

  return (
    coerceTranslatorResponse({
      original_text: request.input_text.trim(),
      translated_text: "",
      source_language: request.source_language,
      target_language: request.target_language,
      target_dialect: request.target_dialect,
      natural_translation: "",
      pronunciation_simple: request.input_text.trim(),
      confidence_score: 0.1,
      validation_status: "uncertain",
      source: "unavailable",
      reliability_label: "Unavailable",
      unavailable_reason: reason,
      provider_status: providerStatus,
      diagnostics: includeDiagnostics ? options.diagnostics : undefined,
    }) ?? {
      original_text: request.input_text.trim(),
      translated_text: "",
      source_language: request.source_language,
      target_language: request.target_language,
      natural_translation: "",
      pronunciation_simple: request.input_text.trim(),
      confidence_score: 0.1,
      validation_status: "uncertain" as const,
      source: "unavailable" as const,
      reliability_label: "Unavailable",
      unavailable_reason: reason,
      provider_status: providerStatus,
    }
  );
}

export type TranslationPipelineResult = TranslatorResponse & {
  _diagnostics?: string[];
};

/**
 * Translation provider pipeline:
 * 1. English-to-English parity
 * 2. Curated dictionary exact match
 * 3. Exact phrase pack match
 * 4. Rule/template/keyword fallback (when enabled)
 * 5. AI translation (when configured and enabled)
 * 6. Unavailable with a single clear reason
 */
export async function runTranslationPipeline(
  request: TranslatorRequest,
): Promise<TranslatorResponse> {
  const diagnostics: string[] = [];

  if (
    isEnglishLanguage(request.source_language) &&
    isEnglishLanguage(request.target_language) &&
    !isAustralianEnglishTarget(request)
  ) {
    return resolveEnglishToEnglish(request);
  }

  const dictionary = tryDictionaryTranslation(request);
  if (dictionary) {
    diagnostics.push("matched:dictionary");
    return attachDiagnostics(dictionary, request, diagnostics);
  }
  diagnostics.push("miss:dictionary");

  const blaanVerified = tryBlaanVerifiedTranslation(request);
  if (blaanVerified) {
    diagnostics.push("matched:blaan_verified");
    return attachDiagnostics(blaanVerified, request, diagnostics);
  }
  if (isBlaanTarget(request)) {
    diagnostics.push("miss:blaan_verified");
    return buildUnavailableResponse(request, {
      aiAttempted: false,
      reason:
        "No verified B'laan translation is available for this text yet. Lexienn only returns attested B'laan from documented sources—not Tagalog, Bisaya, Cebuano, or AI guesses.",
      diagnostics: [...diagnostics, "skip:blaan_unverified"].join(" → "),
    });
  }

  const phrasePack = tryExactPhrasePack(request);
  if (phrasePack) {
    diagnostics.push("matched:phrase_pack");
    return attachDiagnostics(phrasePack, request, diagnostics);
  }
  diagnostics.push("miss:phrase_pack");

  const ruleFallback = tryRuleFallbackTranslation(request);
  if (ruleFallback) {
    diagnostics.push("matched:rule_fallback");
    return attachDiagnostics(ruleFallback, request, diagnostics);
  }
  diagnostics.push("miss:rule_fallback");

  let aiAttempted = false;
  if (request.ai_translation_enabled && isAiTranslationConfigured()) {
    aiAttempted = true;
    diagnostics.push("attempt:ai");
    const aiResult = await translateSentenceWithAi(request);
    if (aiResult) {
      diagnostics.push("matched:ai");
      return attachDiagnostics(aiResult, request, diagnostics);
    }
    diagnostics.push("miss:ai");
  } else if (request.ai_translation_enabled) {
    diagnostics.push("skip:ai_not_configured");
  } else {
    diagnostics.push("skip:ai_disabled");
  }

  return buildUnavailableResponse(request, {
    aiAttempted,
    diagnostics: diagnostics.join(" → "),
  });
}

function attachDiagnostics(
  response: TranslatorResponse,
  request: TranslatorRequest,
  diagnostics: string[],
): TranslatorResponse {
  const includeDiagnostics =
    request.include_diagnostics || process.env.NODE_ENV === "development";

  return (
    coerceTranslatorResponse({
      ...response,
      provider_status: buildProviderStatus(request),
      diagnostics: includeDiagnostics
        ? [response.diagnostics, diagnostics.join(" → ")].filter(Boolean).join(" | ")
        : undefined,
    }) ?? response
  );
}
