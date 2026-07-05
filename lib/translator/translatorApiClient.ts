import {
  translatorErrorSchema,
  translatorResponseSchema,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

export class TranslatorApiError extends Error {
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "TranslatorApiError";
    this.details = details;
  }
}

export async function translateSentenceViaApi(
  request: TranslatorRequest,
): Promise<TranslatorResponse> {
  const response = await fetch("/api/translator/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
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
