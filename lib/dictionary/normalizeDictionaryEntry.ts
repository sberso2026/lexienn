import { isAustralianEnglishTarget } from "@/lib/languages/languageOptions";
import { shouldShowInternalDebugUi } from "@/lib/debug/shouldShowInternalDebugUi";
import { normalizeLookupCandidates } from "@/lib/text/normalizeLookupText";
import type {
  ConfidenceStatus,
  DictionaryEntry,
  DictionaryQuery,
  ExampleSentence,
  ProfessionMeaning,
} from "@/lib/schemas";
import { dictionaryEntrySchema } from "@/lib/schemas";

export const DICTIONARY_UNAVAILABLE_MESSAGE =
  "Definition is not available yet for this word. Try another spelling or language pair.";

export function productionConfidence(score: number): ConfidenceStatus {
  return {
    score,
    level: score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low",
  };
}

function isEnglishLanguage(code: string): boolean {
  return code.toLowerCase().startsWith("en");
}

export function isEnglishToEnglishQuery(query: DictionaryQuery): boolean {
  return (
    isEnglishLanguage(query.source_language) &&
    isEnglishLanguage(query.target_language) &&
    !isAustralianEnglishTarget(query)
  );
}

export function applyQueryToEntry(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): DictionaryEntry {
  const targetMeaning = isEnglishToEnglishQuery(query)
    ? entry.detailed_meaning_en
    : entry.target_meaning;

  return dictionaryEntrySchema.parse({
    ...entry,
    input_text: query.input_text.trim(),
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect ?? entry.target_dialect,
    target_meaning: targetMeaning,
    is_mock_data: false,
    mock_data_notice: undefined,
  });
}

export function buildUnavailableEntry(
  query: DictionaryQuery,
  fallbackReason?: string,
): DictionaryEntry {
  const input = query.input_text.trim();
  const message = DICTIONARY_UNAVAILABLE_MESSAGE;
  const detailedMessage =
    shouldShowInternalDebugUi() && fallbackReason
      ? `${message} (${fallbackReason})`
      : message;

  return dictionaryEntrySchema.parse({
    id: `entry-unavailable-${Date.now()}`,
    input_text: input,
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect,
    entry_type: input.split(/\s+/).length >= 2 ? "phrase" : "word",
    general_meaning_en: message,
    detailed_meaning_en: detailedMessage,
    target_meaning: message,
    profession_meanings: [],
    examples: [],
    pronunciation: { simple: input },
    usage_notes: [],
    related_terms: [],
    common_mistakes: [],
    confidence: productionConfidence(0.1),
    validation_status: "uncertain",
    audio_type: "unavailable",
    is_mock_data: false,
  });
}

export type CuratedSeedEntry = {
  id: string;
  input_key: string;
  entry_type: DictionaryEntry["entry_type"];
  general_meaning_en: string;
  detailed_meaning_en: string;
  target_meaning: string;
  closest_local_equivalent_note?: string;
  profession_meanings?: ProfessionMeaning[];
  examples?: ExampleSentence[];
  pronunciation: DictionaryEntry["pronunciation"];
  usage_notes?: string[];
  related_terms?: string[];
  common_mistakes?: string[];
  confidence_score?: number;
  validation_status?: DictionaryEntry["validation_status"];
};

export function buildEntryFromCurated(
  seed: CuratedSeedEntry,
  query: DictionaryQuery,
): DictionaryEntry {
  const entry = dictionaryEntrySchema.parse({
    id: seed.id,
    input_text: query.input_text.trim(),
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect,
    entry_type: seed.entry_type,
    general_meaning_en: seed.general_meaning_en,
    detailed_meaning_en: seed.detailed_meaning_en,
    target_meaning: seed.target_meaning,
    closest_local_equivalent_note: seed.closest_local_equivalent_note,
    profession_meanings: seed.profession_meanings ?? [],
    examples: seed.examples ?? [],
    pronunciation: seed.pronunciation,
    usage_notes: seed.usage_notes ?? [],
    related_terms: seed.related_terms ?? [],
    common_mistakes: seed.common_mistakes ?? [],
    confidence: productionConfidence(seed.confidence_score ?? 0.92),
    validation_status: seed.validation_status ?? "curated",
    audio_type: "synthetic_tts",
    is_mock_data: false,
  });

  return applyQueryToEntry(entry, query);
}

export type GlossarySeedEntry = CuratedSeedEntry & {
  technical_meaning_en: string;
};

export function buildEntryFromGlossary(
  seed: GlossarySeedEntry,
  query: DictionaryQuery,
): DictionaryEntry {
  const engineerMeaning: ProfessionMeaning = {
    context: "engineer",
    meaning_en: seed.technical_meaning_en,
    caution_note:
      "This is a language explanation, not professional design advice.",
  };

  const constructionMeaning: ProfessionMeaning = {
    context: "construction_worker",
    meaning_en: seed.technical_meaning_en,
    caution_note:
      "This is a language explanation, not professional design advice.",
  };

  const professionMeanings = seed.profession_meanings ?? [
    engineerMeaning,
    constructionMeaning,
  ];

  const usageNotes = [
    ...(seed.usage_notes ?? []),
    "This is a language explanation, not professional design advice.",
  ];

  return buildEntryFromCurated(
    {
      ...seed,
      entry_type: seed.entry_type ?? "technical_term",
      profession_meanings: professionMeanings,
      usage_notes: usageNotes,
      validation_status: seed.validation_status ?? "professionally_reviewed",
      confidence_score: seed.confidence_score ?? 0.9,
    },
    query,
  );
}

export function findSeedByInputKey<T extends { input_key: string }>(
  entries: T[],
  inputText: string,
): T | undefined {
  for (const candidate of normalizeLookupCandidates(inputText)) {
    const match = entries.find((entry) => entry.input_key === candidate);
    if (match) return match;
  }
  return undefined;
}
