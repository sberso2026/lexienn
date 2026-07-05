import {
  getMockDictionaryEntryByInput,
  SEED_DATA_NOTICE,
  SEED_DATA_VALIDATION,
  mockConfidence,
} from "@/lib/mock";
import { enrichEntryWithProfessionContext } from "@/lib/dictionary/professionEngine";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";
import { dictionaryEntrySchema } from "@/lib/schemas";

function inferEntryType(input: string): DictionaryEntry["entry_type"] {
  const trimmed = input.trim();
  if (trimmed.includes("?") || trimmed.split(/\s+/).length >= 5) {
    return "sentence";
  }
  if (trimmed.split(/\s+/).length >= 2) {
    return "phrase";
  }
  return "word";
}

function generateFallbackEntry(query: DictionaryQuery): DictionaryEntry {
  const input = query.input_text.trim();
  const entryType = inferEntryType(input);

  return dictionaryEntrySchema.parse({
    id: `entry-generated-${Date.now()}`,
    input_text: input,
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect,
    entry_type: entryType,
    general_meaning_en: `No curated definition exists yet for "${input}". Enable AI generation or add a curated entry for a richer response.`,
    detailed_meaning_en: `This is a generated placeholder result for "${input}". Connect AI or add a curated entry for a richer response.`,
    target_meaning: `[Illustrative translation for ${query.target_language}] ${input}`,
    closest_local_equivalent_note:
      "No exact offline match in seed data. This translation is illustrative only.",
    profession_meanings: [],
    examples: [
      {
        text: input,
        language_code: query.source_language,
        context_label: "Your input",
      },
    ],
    pronunciation: {
      simple: input,
    },
    usage_notes: [
      `Explanation level: ${query.explanation_level}`,
      `Output mode: ${query.output_mode}`,
      `User context: ${query.user_context}`,
    ],
    related_terms: [],
    common_mistakes: [],
    confidence: mockConfidence(0.35),
    validation_status: SEED_DATA_VALIDATION,
    audio_type: "unavailable",
    is_mock_data: true,
    mock_data_notice: SEED_DATA_NOTICE,
  });
}

/**
 * Resolve a dictionary result from seed mock data or generate a safe fallback.
 */
export function resolveMockDictionaryResult(
  query: DictionaryQuery,
): DictionaryEntry {
  const existing = getMockDictionaryEntryByInput(query.input_text);

  const base = existing
    ? dictionaryEntrySchema.parse({
        ...existing,
        input_text: query.input_text.trim(),
        source_language: query.source_language,
        target_language: query.target_language,
        target_dialect: query.target_dialect ?? existing.target_dialect,
      })
    : generateFallbackEntry(query);

  return enrichEntryWithProfessionContext(base, query);
}
