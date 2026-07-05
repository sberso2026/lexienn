import { z } from "zod";

export const aiStatusResponseSchema = z.object({
  ai_enabled: z.boolean(),
  provider: z.string(),
  provider_configured: z.boolean(),
  model_configured: z.boolean(),
  fallback_enabled: z.boolean(),
});

export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;
