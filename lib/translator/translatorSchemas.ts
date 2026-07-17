import { z } from "zod";
import { userContextSchema, validationStatusSchema } from "@/lib/schemas";

export const translationModeSchema = z.enum([
  "direct",
  "natural",
  "polite",
  "simple",
  "speak_to_local",
]);

export const translationSourceSchema = z.enum([
  "curated_phrase",
  "dictionary",
  "phrase_pack",
  "ai",
  "rule_fallback",
  "unavailable",
]);

export const translatorRequestSchema = z.object({
  input_text: z.string().min(1, "Input text is required"),
  source_language: z.string().min(1),
  target_language: z.string().min(1),
  target_dialect: z.string().optional(),
  target_language_selection: z.string().optional(),
  target_locale_tag: z.string().optional(),
  target_dialect_label: z.string().optional(),
  target_display_name: z.string().optional(),
  user_context: userContextSchema.default("general"),
  translation_mode: translationModeSchema.default("natural"),
  ai_translation_enabled: z.boolean().default(true),
  rule_fallback_enabled: z.boolean().default(true),
  include_diagnostics: z.boolean().optional(),
});

export const translatorProviderStatusSchema = z.object({
  ai_configured: z.boolean(),
  ai_translation_enabled: z.boolean(),
  rule_fallback_enabled: z.boolean(),
});

export const translatorResponseSchema = z.object({
  original_text: z.string().min(1),
  translated_text: z.string(),
  source_language: z.string().min(1),
  target_language: z.string().min(1),
  target_dialect: z.string().optional(),
  literal_translation: z.string().optional(),
  natural_translation: z.string(),
  pronunciation_simple: z.string(),
  usage_note: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
  validation_status: validationStatusSchema,
  source: translationSourceSchema,
  reliability_label: z.string().min(1),
  caution_note: z.string().optional(),
  unavailable_reason: z.string().optional(),
  provider_status: translatorProviderStatusSchema.optional(),
  diagnostics: z.string().optional(),
});

export const translatorErrorSchema = z.object({
  error: z.string(),
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type TranslationMode = z.infer<typeof translationModeSchema>;
export type TranslationSource = z.infer<typeof translationSourceSchema>;
export type TranslatorRequest = z.infer<typeof translatorRequestSchema>;
export type TranslatorResponse = z.infer<typeof translatorResponseSchema>;
export type TranslatorProviderStatus = z.infer<
  typeof translatorProviderStatusSchema
>;

export const AI_NOT_CONFIGURED_MESSAGE =
  "Translation is temporarily unavailable. Try again or use an offline pack.";

export const TRANSLATION_UNAVAILABLE_MESSAGE =
  "Translation is not available yet for this phrase. Try a simpler phrase or download an offline pack.";

export const TRANSLATION_SOURCE_LABELS: Record<TranslationSource, string> = {
  curated_phrase: "Curated phrase",
  dictionary: "Dictionary",
  phrase_pack: "Phrase pack",
  ai: "AI generated",
  rule_fallback: "Approximate match",
  unavailable: "Unavailable",
};

export function coerceTranslatorResponse(data: unknown): TranslatorResponse | null {
  const parsed = translatorResponseSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function getReliabilityLabel(
  source: TranslationSource,
  confidence: number,
): string {
  if (source === "unavailable") return "Unavailable";
  if (source === "curated_phrase") return "Curated phrase match";
  if (source === "dictionary") return "Curated dictionary match";
  if (source === "phrase_pack") return "Exact phrase pack match";
  if (source === "ai") {
    return confidence >= 0.8 ? "AI translation (high confidence)" : "AI translation (review recommended)";
  }
  if (source === "rule_fallback") {
    return confidence >= 0.6
      ? "Approximate translation — review recommended"
      : "Low-confidence approximate match";
  }
  return "Translation available";
}
