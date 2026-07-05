import { z } from "zod";

/** Legacy snake_case fields kept for internal diagnostics. */
export const aiStatusResponseSchema = z.object({
  ai_enabled: z.boolean(),
  provider: z.string(),
  provider_configured: z.boolean(),
  model_configured: z.boolean(),
  fallback_enabled: z.boolean(),
});

/** Public-safe production status (camelCase). Never includes secrets. */
export const aiPublicStatusResponseSchema = z.object({
  aiEnabled: z.boolean(),
  providerConfigured: z.boolean(),
  modelConfigured: z.boolean(),
  hasApiKey: z.boolean(),
  timeoutMs: z.number().int().positive(),
  runtime: z.literal("server"),
  developerMode: z.boolean(),
  provider: z.string(),
  fallbackEnabled: z.boolean(),
});

export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;
export type AiPublicStatusResponse = z.infer<typeof aiPublicStatusResponseSchema>;
