import {
  findBlaanVerifiedPhrase,
  isLikelyPhilippineLinguaFrancaOutput,
} from "@/lib/languages/blaanVerifiedPhrases";
import { isBlaanTarget } from "@/lib/languages/philippineIndigenousLanguages";
import { buildCautionNote } from "@/lib/translator/translationShared";
import {
  coerceTranslatorResponse,
  getReliabilityLabel,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

export function tryBlaanVerifiedTranslation(
  request: TranslatorRequest,
): TranslatorResponse | null {
  if (!isBlaanTarget(request)) return null;

  const verified = findBlaanVerifiedPhrase(request.input_text, request.target_dialect);
  if (!verified) return null;

  const translated = verified.blaan.trim();
  if (!translated || isLikelyPhilippineLinguaFrancaOutput(translated)) return null;

  return (
    coerceTranslatorResponse({
      original_text: request.input_text.trim(),
      translated_text: translated,
      source_language: request.source_language,
      target_language: request.target_language,
      target_dialect: request.target_dialect,
      natural_translation: translated,
      pronunciation_simple: verified.pronunciation_simple,
      usage_note:
        verified.usage_note ??
        `Verified B'laan catalog match (${verified.sources.join("; ")}).`,
      confidence_score: 0.92,
      validation_status: "verified_dictionary",
      source: "dictionary",
      reliability_label: getReliabilityLabel("dictionary", 0.92),
      caution_note: buildCautionNote(request),
    }) ?? null
  );
}
