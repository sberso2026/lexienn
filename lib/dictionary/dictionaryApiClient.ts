import {

  dictionaryGenerateErrorSchema,

  dictionaryGenerateResponseSchema,

  type DictionaryGenerateResponse,

} from "@/lib/dictionary/apiSchemas";

import type { DictionaryQuery } from "@/lib/schemas";

import {

  runCachedRequest,

  type RequestAbortError,

} from "@/lib/request/requestCache";

import {

  buildDictionaryRequestKey,

  DICTIONARY_CACHE_TTL_MS,

} from "@/lib/request/requestKeys";



export { RequestAbortError };



export class DictionaryApiError extends Error {

  details?: Array<{ path: string; message: string }>;



  constructor(message: string, details?: Array<{ path: string; message: string }>) {

    super(message);

    this.name = "DictionaryApiError";

    this.details = details;

  }

}



export type DictionaryApiResult = {

  response: DictionaryGenerateResponse;

  fromCache: boolean;

};



async function fetchDictionaryEntry(

  query: DictionaryQuery,

  signal?: AbortSignal,

): Promise<DictionaryGenerateResponse> {

  const response = await fetch("/api/dictionary/generate", {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

    },

    body: JSON.stringify(query),

    signal,

  });



  const payload: unknown = await response.json().catch(() => null);



  if (!response.ok) {

    const parsedError = dictionaryGenerateErrorSchema.safeParse(payload);

    if (parsedError.success) {

      throw new DictionaryApiError(

        parsedError.data.error,

        parsedError.data.details,

      );

    }

    throw new DictionaryApiError("Failed to generate dictionary entry.");

  }



  const parsed = dictionaryGenerateResponseSchema.safeParse(payload);

  if (!parsed.success) {

    throw new DictionaryApiError("Received an invalid dictionary response.");

  }



  return parsed.data;

}



export async function generateDictionaryEntryViaApi(

  query: DictionaryQuery,

  options?: { signal?: AbortSignal },

): Promise<DictionaryApiResult> {

  const key = buildDictionaryRequestKey(query);

  const { data, fromCache } = await runCachedRequest<DictionaryGenerateResponse>({

    key,

    ttlMs: DICTIONARY_CACHE_TTL_MS,

    signal: options?.signal,

    shouldCache: (result) => result.source !== "unavailable",

    fetcher: (signal) => fetchDictionaryEntry(query, signal),

  });



  return { response: data, fromCache };

}


