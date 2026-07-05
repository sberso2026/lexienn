import { applyQueryToEntry } from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";

/**
 * External dictionary provider hook. Returns null when no provider is configured
 * or when lookup fails — callers continue the resolution pipeline.
 */
export async function lookupExternalDictionary(
  query: DictionaryQuery,
): Promise<DictionaryEntry | null> {
  const apiKey = process.env.DICTIONARY_PROVIDER_API_KEY?.trim();
  if (!apiKey) return null;

  // Batch 16: provider integration point — no external API wired yet.
  void query;
  return null;
}

export function normalizeExternalEntry(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): DictionaryEntry {
  return applyQueryToEntry(
    {
      ...entry,
      validation_status: entry.validation_status ?? "verified_dictionary",
      is_mock_data: false,
      mock_data_notice: undefined,
    },
    query,
  );
}
