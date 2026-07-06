import { z } from "zod";

const sampleSentenceSchema = z.union([
  z.string().min(1),
  z.object({
    text: z.string().min(1),
    languageCode: z.string().min(1).optional(),
    language_code: z.string().min(1).optional(),
    contextLabel: z.string().optional(),
    context_label: z.string().optional(),
  }),
]);

export const aiDictionaryResultSchema = z.object({
  word: z.string().min(1),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  partOfSpeech: z.string().min(1).default("word"),
  generalMeaning: z.string().min(1),
  detailedMeaning: z.string().min(1),
  definitionSummary: z.string().min(1),
  sampleSentences: z.array(sampleSentenceSchema).default([]),
  pronunciationText: z.string().min(1),
  usageNotes: z.array(z.string()).default([]),
  relatedTerms: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(1).default(0.65),
  confidenceLabel: z.enum(["high", "medium", "low"]).default("medium"),
  validationStatus: z.literal("ai_generated_unverified").default("ai_generated_unverified"),
});

export type AiDictionaryResult = z.infer<typeof aiDictionaryResultSchema>;

export type AiDictionaryParseErrorCode = "invalid_json" | "schema_mismatch";

export type AiDictionaryParseResult =
  | { success: true; data: AiDictionaryResult }
  | { success: false; code: AiDictionaryParseErrorCode; detail?: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** Normalize common AI key variants into the strict camelCase schema shape. */
export function coerceAiDictionaryResultPayload(raw: unknown): unknown {
  const obj = asRecord(raw);
  if (!obj) return raw;

  const pickString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return undefined;
  };

  const pickNumber = (...keys: string[]): number | undefined => {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return undefined;
  };

  const pickArray = (...keys: string[]): unknown[] | undefined => {
    for (const key of keys) {
      const value = obj[key];
      if (Array.isArray(value)) return value;
    }
    return undefined;
  };

  const pronunciationObj = asRecord(obj.pronunciation);

  return {
    word: pickString("word", "input_text", "inputText"),
    sourceLanguage: pickString("sourceLanguage", "source_language"),
    targetLanguage: pickString("targetLanguage", "target_language"),
    partOfSpeech:
      pickString("partOfSpeech", "part_of_speech", "entry_type", "entryType") ??
      "word",
    generalMeaning: pickString(
      "generalMeaning",
      "general_meaning",
      "general_meaning_en",
      "general_meaning_english",
    ),
    detailedMeaning: pickString(
      "detailedMeaning",
      "detailed_meaning",
      "detailed_meaning_en",
      "detailed_meaning_english",
    ),
    definitionSummary: pickString(
      "definitionSummary",
      "definition_summary",
      "target_meaning",
      "target_language_meaning",
      "targetMeaning",
      "translation",
    ),
    sampleSentences:
      pickArray("sampleSentences", "sample_sentences", "examples") ?? [],
    pronunciationText:
      pickString("pronunciationText", "pronunciation_text") ??
      (typeof pronunciationObj?.simple === "string"
        ? pronunciationObj.simple
        : undefined) ??
      pickString("word", "input_text", "inputText") ??
      "unknown",
    usageNotes: pickArray("usageNotes", "usage_notes") ?? [],
    relatedTerms: pickArray("relatedTerms", "related_terms") ?? [],
    commonMistakes: pickArray("commonMistakes", "common_mistakes") ?? [],
    confidenceScore: pickNumber("confidenceScore", "confidence_score"),
    confidenceLabel: pickString("confidenceLabel", "confidence_label"),
    validationStatus:
      obj.validationStatus === "ai_generated_unverified" ||
      obj.validation_status === "ai_generated_unverified"
        ? "ai_generated_unverified"
        : "ai_generated_unverified",
  };
}

export function parseAiDictionaryResult(raw: unknown): AiDictionaryParseResult {
  try {
    const coerced = coerceAiDictionaryResultPayload(raw);
    const parsed = aiDictionaryResultSchema.safeParse(coerced);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return {
      success: false,
      code: "schema_mismatch",
      detail: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  } catch {
    return { success: false, code: "invalid_json" };
  }
}
