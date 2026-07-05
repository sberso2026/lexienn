import { cleanTextForSpeech } from "@/lib/audio/speechText";
import { findCuratedPhrase } from "@/lib/translator/curatedPhrases";
import { buildCautionNote } from "@/lib/translator/translationShared";
import {
  coerceTranslatorResponse,
  getReliabilityLabel,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

export function tryCuratedPhraseTranslation(
  request: TranslatorRequest,
): TranslatorResponse | null {
  const entry = findCuratedPhrase(request.input_text, request.target_language);
  if (!entry) return null;

  const translated = cleanTextForSpeech(entry.translated_text);
  if (!translated) return null;

  const confidence = 0.95;

  return coerceTranslatorResponse({
    original_text: request.input_text.trim(),
    translated_text: translated,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect,
    natural_translation: translated,
    pronunciation_simple: entry.pronunciation_simple,
    usage_note: entry.usage_note ?? "Curated phrase translation.",
    confidence_score: confidence,
    validation_status: "curated",
    source: "curated_phrase",
    reliability_label: getReliabilityLabel("curated_phrase", confidence),
    caution_note: buildCautionNote(request),
  });
}
