import { z } from "zod";
import { dictionaryResolutionSourceSchema } from "@/lib/schemas";
import { dictionaryEntrySchema, dictionaryQuerySchema } from "@/lib/schemas";

export const dictionaryGenerationSourceSchema = dictionaryResolutionSourceSchema;

export const dictionaryDiagnosticsSchema = z.object({
  dictionary_source: dictionaryResolutionSourceSchema,
  ai_enabled: z.boolean(),
  provider_configured: z.boolean(),
  model_configured: z.boolean(),
  used_ai: z.boolean(),
  used_fallback: z.boolean(),
  fallback_reason: z.string().optional(),
});

export const dictionaryGenerateResponseSchema = z.object({
  query: dictionaryQuerySchema,
  entry: dictionaryEntrySchema,
  source: dictionaryGenerationSourceSchema,
  diagnostics: dictionaryDiagnosticsSchema.optional(),
});

export type DictionaryGenerateResponse = z.infer<
  typeof dictionaryGenerateResponseSchema
>;

export type DictionaryDiagnostics = z.infer<typeof dictionaryDiagnosticsSchema>;

export const dictionaryGenerateErrorSchema = z.object({
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
