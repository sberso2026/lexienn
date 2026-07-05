import type {
  DictionaryEntry,
  DictionaryQuery,
  SavedWord,
} from "@/lib/schemas";
import { savedWordSchema } from "@/lib/schemas";

export function createSavedWordFromResult(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): SavedWord {
  const savedWord: SavedWord = {
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    input_text: entry.input_text,
    entry_type: entry.entry_type,
    target_language: query.target_language,
    target_dialect: query.target_dialect,
    user_context: query.user_context,
    short_meaning: entry.general_meaning_en,
    target_meaning: entry.target_meaning,
    pronunciation_simple: entry.pronunciation.simple,
    saved_at: new Date().toISOString(),
    validation_status: entry.validation_status,
    confidence_score: entry.confidence.score,
  };

  return savedWordSchema.parse(savedWord);
}

export function savedWordMatchKey(word: Pick<
  SavedWord,
  "input_text" | "target_language" | "target_dialect" | "user_context"
>): string {
  return [
    word.input_text.trim().toLowerCase(),
    word.target_language,
    word.target_dialect ?? "",
    word.user_context,
  ].join("|");
}
