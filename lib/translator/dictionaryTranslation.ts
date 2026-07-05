import { cleanTextForSpeech } from "@/lib/audio/speechText";
import { findCuratedEntry } from "@/lib/dictionary/curatedDictionary";
import { buildEntryFromCurated } from "@/lib/dictionary/normalizeDictionaryEntry";
import {
  coerceTranslatorResponse,
  getReliabilityLabel,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";
import { buildCautionNote } from "@/lib/translator/translationShared";

export function tryDictionaryTranslation(
  request: TranslatorRequest,
): TranslatorResponse | null {
  const seed = findCuratedEntry(request.input_text);
  if (!seed) return null;

  const entry = buildEntryFromCurated(seed, {
    input_text: request.input_text,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect,
    user_context: request.user_context,
    explanation_level: "normal",
    output_mode: "translate",
  });

  const translated = cleanTextForSpeech(entry.target_meaning);
  if (!translated) return null;

  const confidence = entry.confidence.score;

  return coerceTranslatorResponse({
    original_text: request.input_text.trim(),
    translated_text: translated,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect,
    literal_translation: entry.general_meaning_en,
    natural_translation: translated,
    pronunciation_simple: entry.pronunciation.simple,
    usage_note: "Matched curated dictionary entry for this word or phrase.",
    confidence_score: confidence,
    validation_status: entry.validation_status,
    source: "dictionary",
    reliability_label: getReliabilityLabel("dictionary", confidence),
    caution_note: buildCautionNote(request),
  });
}
