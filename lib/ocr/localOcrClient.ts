import type { OcrExtractResponse } from "@/lib/ocr/ocrSchemas";

/**
 * Browser local OCR is not bundled in the current web build.
 * Cloud OCR (server-side) and manual text entry are used instead.
 */
export function isLocalOcrAvailable(): boolean {
  return false;
}

export async function extractTextLocally(): Promise<OcrExtractResponse | null> {
  return null;
}
