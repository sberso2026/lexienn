import {
  dictionaryGenerateErrorSchema,
  dictionaryGenerateResponseSchema,
  type DictionaryGenerateResponse,
} from "@/lib/dictionary/apiSchemas";
import type { DictionaryQuery } from "@/lib/schemas";

export class DictionaryApiError extends Error {
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "DictionaryApiError";
    this.details = details;
  }
}

export async function generateDictionaryEntryViaApi(
  query: DictionaryQuery,
): Promise<DictionaryGenerateResponse> {
  const response = await fetch("/api/dictionary/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
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
