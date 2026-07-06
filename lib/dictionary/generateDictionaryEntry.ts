import { enrichEntryWithProfessionContext } from "@/lib/dictionary/professionEngine";
import {
  resolveDictionaryFromSources,
  shouldEnrichWithProfessionContext,
} from "@/lib/dictionary/dictionarySources";
import type { DictionaryDiagnostics } from "@/lib/dictionary/apiSchemas";
import type { DictionaryEntry, DictionaryQuery, DictionaryResolutionSource } from "@/lib/schemas";

export type DictionaryGenerationSource = DictionaryResolutionSource;

export type DictionaryGenerationResult = {
  query: DictionaryQuery;
  entry: DictionaryEntry;
  source: DictionaryGenerationSource;
  /** Always populated for server-side logging; omit from client JSON unless Developer Mode. */
  diagnostics: DictionaryDiagnostics;
};

export async function generateDictionaryEntry(
  query: DictionaryQuery,
): Promise<DictionaryGenerationResult> {
  const { entry, source, diagnostics } = await resolveDictionaryFromSources(query);

  if (!shouldEnrichWithProfessionContext(source)) {
    return { query, entry, source, diagnostics };
  }

  return {
    query,
    entry: enrichEntryWithProfessionContext(entry, query),
    source,
    diagnostics,
  };
}
