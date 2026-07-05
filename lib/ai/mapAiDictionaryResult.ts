import type { AiDictionaryResult } from "@/lib/ai/aiDictionaryResultSchema";
import {
  isEnglishToEnglishQuery,
  productionConfidence,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery, ExampleSentence } from "@/lib/schemas";
import { dictionaryEntrySchema, entryTypeSchema } from "@/lib/schemas";

function inferEntryType(
  input: string,
  partOfSpeech: string,
): DictionaryEntry["entry_type"] {
  const pos = partOfSpeech.toLowerCase().trim();
  const posAsEntry = entryTypeSchema.safeParse(pos);
  if (posAsEntry.success) return posAsEntry.data;

  if (pos.includes("idiom")) return "idiom";
  if (pos.includes("phrase")) return "phrase";
  if (pos.includes("technical")) return "technical_term";
  if (pos.includes("proverb")) return "proverb";
  if (pos.includes("slang")) return "slang";

  const trimmed = input.trim();
  if (trimmed.split(/\s+/).length >= 2) return "phrase";
  return "word";
}

function mapSampleSentences(
  samples: AiDictionaryResult["sampleSentences"],
  query: DictionaryQuery,
): ExampleSentence[] {
  return samples.map((item) => {
    if (typeof item === "string") {
      return {
        text: item,
        language_code: query.source_language,
        context_label: "Example",
      };
    }

    return {
      text: item.text,
      language_code:
        item.languageCode ?? item.language_code ?? query.source_language,
      context_label: item.contextLabel ?? item.context_label ?? "Example",
    };
  });
}

function resolvePronunciationText(
  result: AiDictionaryResult,
  query: DictionaryQuery,
): string {
  if (typeof result.pronunciationText === "string" && result.pronunciationText.trim()) {
    return result.pronunciationText.trim();
  }
  return query.input_text.trim();
}

export function mapAiDictionaryResultToEntry(
  result: AiDictionaryResult,
  query: DictionaryQuery,
): DictionaryEntry {
  const input = query.input_text.trim();
  const targetMeaning = isEnglishToEnglishQuery(query)
    ? result.detailedMeaning
    : result.definitionSummary;

  const score = result.confidenceScore ?? 0.65;
  const confidence = productionConfidence(score);
  if (result.confidenceLabel) {
    confidence.level = result.confidenceLabel;
  }

  return dictionaryEntrySchema.parse({
    id: `entry-ai-${Date.now()}`,
    input_text: input,
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect,
    entry_type: inferEntryType(input, result.partOfSpeech),
    general_meaning_en: result.generalMeaning,
    detailed_meaning_en: result.detailedMeaning,
    target_meaning: targetMeaning,
    profession_meanings: [],
    examples: mapSampleSentences(result.sampleSentences, query),
    pronunciation: { simple: resolvePronunciationText(result, query) },
    usage_notes: result.usageNotes,
    related_terms: result.relatedTerms,
    common_mistakes: result.commonMistakes,
    confidence,
    validation_status: "ai_generated_unverified",
    audio_type: "synthetic_tts",
    is_mock_data: false,
  });
}
