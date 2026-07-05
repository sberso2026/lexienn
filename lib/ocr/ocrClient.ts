import { isLocalOcrAvailable, extractTextLocally } from "@/lib/ocr/localOcrClient";
import type { OcrExtractRequest, OcrExtractResponse } from "@/lib/ocr/ocrSchemas";
import {
  ocrErrorSchema,
  ocrExtractResponseSchema,
} from "@/lib/ocr/ocrSchemas";

export class OcrApiError extends Error {
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "OcrApiError";
    this.details = details;
  }
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export type OcrClientResult = OcrExtractResponse & {
  ocr_mode: "local" | "cloud" | "manual_fallback";
};

export async function extractTextFromImageViaClient(
  request: OcrExtractRequest,
): Promise<OcrClientResult> {
  if (isLocalOcrAvailable()) {
    const local = await extractTextLocally();
    if (local?.extracted_text) {
      return { ...local, ocr_mode: "local" };
    }
  }

  if (!isBrowserOnline()) {
    return {
      ...ocrExtractResponseSchema.parse({
        extracted_text: "",
        confidence_score: 0,
        warnings: ["Offline — enter text manually or use a downloaded offline pack."],
        source: "unavailable",
        unavailable_reason:
          "Image text extraction is unavailable offline. Try typing the text manually.",
      }),
      ocr_mode: "manual_fallback",
    };
  }

  const response = await fetch("/api/ocr/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = ocrErrorSchema.safeParse(payload);
    if (parsedError.success) {
      throw new OcrApiError(parsedError.data.error, parsedError.data.details);
    }
    throw new OcrApiError("Image text extraction failed.");
  }

  const parsed = ocrExtractResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new OcrApiError("Received an invalid OCR response.");
  }

  return {
    ...parsed.data,
    ocr_mode: parsed.data.source === "cloud_ocr" ? "cloud" : "manual_fallback",
  };
}

export async function fetchOcrStatus(): Promise<{
  ocr_enabled: boolean;
  provider_configured: boolean;
  local_ocr_available: boolean;
}> {
  const response = await fetch("/api/ocr/status");
  if (!response.ok) {
    return {
      ocr_enabled: false,
      provider_configured: false,
      local_ocr_available: isLocalOcrAvailable(),
    };
  }
  return (await response.json()) as {
    ocr_enabled: boolean;
    provider_configured: boolean;
    local_ocr_available: boolean;
  };
}
