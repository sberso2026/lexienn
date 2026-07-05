import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";
import { getAiConfig } from "@/lib/ai/config";
import { getOcrConfig, getOcrTimeoutMs } from "@/lib/ocr/ocrConfig";
import {
  getOcrLanguageHint,
  normalizeDetectedLanguage,
} from "@/lib/ocr/ocrLanguageHints";
import type { OcrExtractRequest, OcrExtractResponse } from "@/lib/ocr/ocrSchemas";
import { ocrExtractResponseSchema } from "@/lib/ocr/ocrSchemas";

type VisionPayload = {
  extracted_text?: string;
  detected_language?: string;
  confidence_score?: number;
  blocks?: Array<{
    text?: string;
    confidence_score?: number;
    bounding_box_json?: string;
    reading_order?: number;
  }>;
  warnings?: string[];
};

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function buildUnavailableResponse(reason: string): OcrExtractResponse {
  return ocrExtractResponseSchema.parse({
    extracted_text: "",
    confidence_score: 0,
    warnings: [],
    source: "unavailable",
    unavailable_reason: reason,
  });
}

export async function extractTextFromImageCloud(
  request: OcrExtractRequest,
): Promise<OcrExtractResponse> {
  const ocrConfig = getOcrConfig();
  const aiConfig = getAiConfig();

  if (!ocrConfig.enabled) {
    return buildUnavailableResponse("Image text extraction is disabled.");
  }

  if (!ocrConfig.isConfigured || !aiConfig.apiKey) {
    return buildUnavailableResponse(
      "Image text extraction is unavailable. Try typing the text manually.",
    );
  }

  const languageHint = getOcrLanguageHint(request.source_language_hint);
  const prompt = [
    "Extract all visible printed text from this image.",
    "Return strict JSON only with keys:",
    '{"extracted_text":"","detected_language":"","confidence_score":0.0,"blocks":[{"text":"","confidence_score":0.0,"reading_order":0}],"warnings":[]}',
    `Expected source language hint: ${languageHint}.`,
    "Do not invent text. Do not translate. Preserve line breaks only when clearly present.",
    "If no readable text is visible, return extracted_text as an empty string and confidence_score 0.",
    "Do not claim handwriting support unless the handwriting is clearly legible printed-style text.",
  ].join(" ");

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: ocrConfig.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${request.image_mime_type};base64,${request.image_base64}`,
                },
              },
            ],
          },
        ],
      }),
      signal: createTimeoutSignal(getOcrTimeoutMs()),
    });
  } catch {
    return buildUnavailableResponse(
      "Image text extraction timed out. Try typing the text manually.",
    );
  }

  if (!response.ok) {
    return buildUnavailableResponse(
      "Image text extraction is unavailable. Try typing the text manually.",
    );
  }

  try {
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return buildUnavailableResponse(
        "Image text extraction is unavailable. Try typing the text manually.",
      );
    }

    const parsedJson = extractJsonFromAiText(content);
    if (!parsedJson || typeof parsedJson !== "object") {
      return buildUnavailableResponse(
        "Image text extraction is unavailable. Try typing the text manually.",
      );
    }

    const parsed = parsedJson as VisionPayload;
    const extractedText = String(parsed.extracted_text ?? "").trim();
    const blocks =
      parsed.blocks
        ?.map((block, index) => ({
          text: String(block.text ?? "").trim(),
          confidence_score:
            typeof block.confidence_score === "number" ? block.confidence_score : undefined,
          bounding_box_json: block.bounding_box_json,
          reading_order: block.reading_order ?? index,
        }))
        .filter((block) => block.text.length > 0) ?? [];

    if (!extractedText && blocks.length > 0) {
      return ocrExtractResponseSchema.parse({
        extracted_text: blocks.map((block) => block.text).join("\n"),
        detected_language: normalizeDetectedLanguage(
          parsed.detected_language,
          request.source_language_hint,
        ),
        confidence_score:
          typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0.55,
        blocks,
        warnings: parsed.warnings ?? [],
        source: "cloud_ocr",
      });
    }

    return ocrExtractResponseSchema.parse({
      extracted_text: extractedText,
      detected_language: normalizeDetectedLanguage(
        parsed.detected_language,
        request.source_language_hint,
      ),
      confidence_score:
        typeof parsed.confidence_score === "number"
          ? Math.min(1, Math.max(0, parsed.confidence_score))
          : extractedText
            ? 0.65
            : 0,
      blocks: blocks.length > 0 ? blocks : undefined,
      warnings: parsed.warnings ?? [],
      source: extractedText ? "cloud_ocr" : "unavailable",
      unavailable_reason: extractedText
        ? undefined
        : "No readable text was detected in this image.",
    });
  } catch {
    return buildUnavailableResponse(
      "Image text extraction is unavailable. Try typing the text manually.",
    );
  }
}

export async function extractTextFromImage(
  request: OcrExtractRequest,
): Promise<OcrExtractResponse> {
  return extractTextFromImageCloud(request);
}
