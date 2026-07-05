import { DICTIONARY_RESULT_STORAGE_KEY } from "./constants";

import { dictionaryDiagnosticsSchema } from "./apiSchemas";

import type { DictionaryDiagnostics } from "./apiSchemas";

import type { DictionaryEntry, DictionaryQuery, DictionaryResolutionSource } from "@/lib/schemas";

import {

  dictionaryEntrySchema,

  dictionaryQuerySchema,

  dictionaryResolutionSourceSchema,

} from "@/lib/schemas";



export interface StoredDictionaryResult {

  query: DictionaryQuery;

  entry: DictionaryEntry;

  source: DictionaryResolutionSource;

  diagnostics?: DictionaryDiagnostics;

}



export function saveDictionaryResult(result: StoredDictionaryResult): void {

  if (typeof window === "undefined") return;

  sessionStorage.setItem(DICTIONARY_RESULT_STORAGE_KEY, JSON.stringify(result));

}



export function loadDictionaryResult(): StoredDictionaryResult | null {

  if (typeof window === "undefined") return null;



  const raw = sessionStorage.getItem(DICTIONARY_RESULT_STORAGE_KEY);

  if (!raw) return null;



  try {

    const parsed = JSON.parse(raw) as unknown;

    if (

      !parsed ||

      typeof parsed !== "object" ||

      !("query" in parsed) ||

      !("entry" in parsed)

    ) {

      return null;

    }



    const stored = parsed as StoredDictionaryResult;

    const queryResult = dictionaryQuerySchema.safeParse(stored.query);

    const entryResult = dictionaryEntrySchema.safeParse(stored.entry);

    const sourceResult = dictionaryResolutionSourceSchema.safeParse(stored.source);

    const diagnosticsResult =

      stored.diagnostics !== undefined

        ? dictionaryDiagnosticsSchema.safeParse(stored.diagnostics)

        : { success: true as const, data: undefined };



    if (

      !queryResult.success ||

      !entryResult.success ||

      !sourceResult.success ||

      !diagnosticsResult.success

    ) {

      return null;

    }



    return {

      query: queryResult.data,

      entry: entryResult.data,

      source: sourceResult.data,

      diagnostics: diagnosticsResult.data,

    };

  } catch {

    return null;

  }

}



export function clearDictionaryResult(): void {

  if (typeof window === "undefined") return;

  sessionStorage.removeItem(DICTIONARY_RESULT_STORAGE_KEY);

}

