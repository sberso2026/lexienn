import {

  translatorErrorSchema,

  translatorResponseSchema,

  type TranslatorRequest,

  type TranslatorResponse,

} from "@/lib/translator/translatorSchemas";

import {

  runCachedRequest,

  type RequestAbortError,

} from "@/lib/request/requestCache";

import {

  buildTranslationRequestKey,

  TRANSLATION_CACHE_TTL_MS,

} from "@/lib/request/requestKeys";



export { RequestAbortError };



export class TranslatorApiError extends Error {

  details?: Array<{ path: string; message: string }>;



  constructor(message: string, details?: Array<{ path: string; message: string }>) {

    super(message);

    this.name = "TranslatorApiError";

    this.details = details;

  }

}



export type TranslatorApiResult = {

  response: TranslatorResponse;

  fromCache: boolean;

};



async function fetchTranslation(

  request: TranslatorRequest,

  signal?: AbortSignal,

): Promise<TranslatorResponse> {

  const response = await fetch("/api/translator/translate", {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

    },

    body: JSON.stringify(request),

    signal,

  });



  const payload: unknown = await response.json().catch(() => null);



  if (!response.ok) {

    const parsedError = translatorErrorSchema.safeParse(payload);

    if (parsedError.success) {

      throw new TranslatorApiError(

        parsedError.data.error,

        parsedError.data.details,

      );

    }



    const looseError =

      typeof payload === "object" &&

      payload !== null &&

      "error" in payload &&

      typeof (payload as { error: unknown }).error === "string"

        ? (payload as { error: string }).error

        : null;



    throw new TranslatorApiError(

      looseError ?? `Translation request failed (HTTP ${response.status}).`,

    );

  }



  const parsed = translatorResponseSchema.safeParse(payload);

  if (!parsed.success) {

    throw new TranslatorApiError("Received an invalid translation response.");

  }



  return parsed.data;

}



export async function translateSentenceViaApi(

  request: TranslatorRequest,

  options?: { signal?: AbortSignal },

): Promise<TranslatorApiResult> {

  const key = buildTranslationRequestKey(request);

  const { data, fromCache } = await runCachedRequest<TranslatorResponse>({

    key,

    ttlMs: TRANSLATION_CACHE_TTL_MS,

    signal: options?.signal,

    shouldCache: (result) => result.source !== "unavailable",

    fetcher: (signal) => fetchTranslation(request, signal),

  });



  return { response: data, fromCache };

}


