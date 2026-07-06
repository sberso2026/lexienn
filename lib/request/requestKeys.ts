import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import type { DictionaryQuery } from "@/lib/schemas";
import type { TranslatorRequest } from "@/lib/translator/translatorSchemas";

export const TRANSLATION_CACHE_TTL_MS = 10 * 60 * 1000;
export const DICTIONARY_CACHE_TTL_MS = 30 * 60 * 1000;

export function buildTranslationRequestKey(request: TranslatorRequest): string {
  return JSON.stringify({
    kind: "translation",
    input: normalizeLookupText(request.input_text),
    source: request.source_language,
    target: request.target_language,
    dialect: request.target_dialect ?? "",
    context: request.user_context,
    mode: request.translation_mode,
    ai: request.ai_translation_enabled,
    rule: request.rule_fallback_enabled,
  });
}

export function buildDictionaryRequestKey(query: DictionaryQuery): string {
  return JSON.stringify({
    kind: "dictionary",
    input: normalizeLookupText(query.input_text),
    source: query.source_language,
    target: query.target_language,
    dialect: query.target_dialect ?? "",
    context: query.user_context,
    level: query.explanation_level,
    output: query.output_mode,
  });
}

export function dictionaryQueriesMatch(
  a: DictionaryQuery,
  b: DictionaryQuery,
): boolean {
  return buildDictionaryRequestKey(a) === buildDictionaryRequestKey(b);
}
