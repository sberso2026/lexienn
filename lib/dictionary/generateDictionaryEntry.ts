import { isServerDeveloperDiagnosticsEnabled } from "@/lib/debug/serverDiagnostics";
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

  diagnostics?: DictionaryDiagnostics;

};



export async function generateDictionaryEntry(

  query: DictionaryQuery,

): Promise<DictionaryGenerationResult> {

  const { entry, source, diagnostics } = await resolveDictionaryFromSources(query);

  const includeDiagnostics = isServerDeveloperDiagnosticsEnabled();


  if (!shouldEnrichWithProfessionContext(source)) {

    return {

      query,

      entry,

      source,

      ...(includeDiagnostics ? { diagnostics } : {}),

    };

  }



  return {

    query,

    entry: enrichEntryWithProfessionContext(entry, query),

    source,

    ...(includeDiagnostics ? { diagnostics } : {}),

  };

}

