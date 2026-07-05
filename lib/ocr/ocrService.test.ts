import { describe, expect, it, vi, afterEach } from "vitest";
import { extractTextFromImageCloud } from "@/lib/ocr/ocrService";
import type { OcrExtractRequest } from "@/lib/ocr/ocrSchemas";

const baseRequest: OcrExtractRequest = {
  image_base64: "aGVsbG8=",
  image_mime_type: "image/png",
  source_language_hint: "auto",
  target_language: "tl",
  user_context: "general",
};

describe("ocrService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns unavailable when OCR is disabled", async () => {
    vi.stubEnv("OCR_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const result = await extractTextFromImageCloud(baseRequest);
    expect(result.source).toBe("unavailable");
    expect(result.extracted_text).toBe("");
  });

  it("returns unavailable when provider is not configured", async () => {
    vi.stubEnv("OCR_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const result = await extractTextFromImageCloud(baseRequest);
    expect(result.source).toBe("unavailable");
    expect(result.unavailable_reason).toContain("Try typing the text manually");
  });

  it("does not invent extracted text when cloud OCR fails", async () => {
    vi.stubEnv("OCR_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );

    const result = await extractTextFromImageCloud(baseRequest);
    expect(result.extracted_text).toBe("");
    expect(result.source).toBe("unavailable");
  });
});
