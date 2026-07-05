import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";
import { getAiConfig } from "@/lib/ai/config";
import { requestOpenAiChatCompletion } from "@/lib/ai/openAiClient";
import { validationStatusSchema } from "@/lib/schemas";
import { buildTranslationPrompt } from "@/lib/translator/translationPrompt";
import {
  isValidTargetLanguageOutput,
  requiresNonEnglishTranslationOutput,
} from "@/lib/translator/translationTargetValidation";
import {
  getReliabilityLabel,
  translatorResponseSchema,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeAiTranslationPayload(
  raw: unknown,
  request: TranslatorRequest,
): unknown {
  const obj = asRecord(raw);
  if (!obj) return raw;

  const original = request.input_text.trim();
  const translated =
    typeof obj.translated_text === "string"
      ? obj.translated_text
      : typeof obj.natural_translation === "string"
        ? obj.natural_translation
        : original;

  const natural =
    typeof obj.natural_translation === "string"
      ? obj.natural_translation
      : translated;

  const pronunciation =
    typeof obj.pronunciation_simple === "string" && obj.pronunciation_simple.length > 0
      ? obj.pronunciation_simple
      : natural;

  const confidenceScore =
    typeof obj.confidence_score === "number"
      ? obj.confidence_score
      : typeof obj.confidence === "number"
        ? obj.confidence
        : 0.65;

  const validationStatus = validationStatusSchema.safeParse(obj.validation_status);

  return {
    original_text: original,
    translated_text: translated,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect,
    literal_translation:
      typeof obj.literal_translation === "string" ? obj.literal_translation : undefined,
    natural_translation: natural,
    pronunciation_simple: pronunciation,
    usage_note: typeof obj.usage_note === "string" ? obj.usage_note : undefined,
    confidence_score: confidenceScore,
    validation_status: validationStatus.success
      ? validationStatus.data
      : "ai_generated",
    source: "ai" as const,
    reliability_label: getReliabilityLabel("ai", confidenceScore),
    caution_note:
      typeof obj.caution_note === "string" ? obj.caution_note : undefined,
  };
}

export function parseAiTranslationResponse(
  rawContent: string | unknown,
  request: TranslatorRequest,
): TranslatorResponse | null {
  try {
    const parsed =
      typeof rawContent === "string"
        ? extractJsonFromAiText(rawContent)
        : rawContent;
    const normalized = normalizeAiTranslationPayload(parsed, request);
    const result = translatorResponseSchema.safeParse(normalized);
    if (!result.success) return null;

    if (!isValidTargetLanguageOutput(request, result.data)) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

async function requestAiTranslation(
  request: TranslatorRequest,
  options: { strictIndigenous?: boolean } = {},
): Promise<string | null> {
  const config = getAiConfig();
  if (!config.isConfigured) return null;

  const { system, user } = buildTranslationPrompt(request, options);

  return requestOpenAiChatCompletion({
    model: config.model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
}

export async function translateSentenceWithAi(
  request: TranslatorRequest,
): Promise<TranslatorResponse | null> {
  const content = await requestAiTranslation(request);
  if (!content) return null;

  const parsed = parseAiTranslationResponse(content, request);
  if (parsed) return parsed;

  if (requiresNonEnglishTranslationOutput(request)) {
    const retryContent = await requestAiTranslation(request, { strictIndigenous: true });
    if (retryContent) {
      return parseAiTranslationResponse(retryContent, request);
    }
  }

  return null;
}

export function isAiTranslationConfigured(): boolean {
  return getAiConfig().isConfigured;
}
