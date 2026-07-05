import { getMockDictionaryEntryByInput } from "@/lib/mock";
import { applyQueryToEntry } from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";
import { dictionaryEntrySchema } from "@/lib/schemas";

/**
 * Returns an exact seed-data entry when the input matches bundled seed data.
 * Does not synthesize placeholder definitions for unknown words.
 */
export function resolveMockSeedDictionaryEntry(
  query: DictionaryQuery,
): DictionaryEntry | null {
  const seed = getMockDictionaryEntryByInput(query.input_text);
  if (!seed) return null;

  const entry = dictionaryEntrySchema.parse({
    ...seed,
    input_text: query.input_text.trim(),
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect ?? seed.target_dialect,
  });

  return applyQueryToEntry(entry, query);
}
