import type { LanguageDetectionPipelineResult } from "@/lib/languages/languageDetectionTypes";

export type ClientLanguageDetectRequest = {
  text: string;
  providerLanguage?: string | null;
  providerConfidence?: number | null;
  allowAi?: boolean;
  signal?: AbortSignal;
};

/**
 * Client bridge for Stage 2 AI language identification via /api/language/detect.
 */
export async function detectLanguageViaApi(
  request: ClientLanguageDetectRequest,
): Promise<LanguageDetectionPipelineResult> {
  const response = await fetch("/api/language/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: request.signal,
    body: JSON.stringify({
      text: request.text,
      provider_language: request.providerLanguage ?? null,
      provider_confidence: request.providerConfidence ?? null,
      allow_ai: request.allowAi !== false,
    }),
  });

  if (!response.ok) {
    throw new Error("Language detection request failed.");
  }

  const payload = (await response.json()) as {
    primary_code: string | null;
    primary_name: string | null;
    secondary_code: string | null;
    secondary_name: string | null;
    confidence: number;
    stage: LanguageDetectionPipelineResult["stage"];
    duration_ms: number;
    from_cache: boolean;
    needs_user_confirmation: boolean;
    message: string;
    ai_called: boolean;
  };

  return {
    transcript: request.text,
    primaryCode: payload.primary_code,
    primaryName: payload.primary_name,
    secondaryCode: payload.secondary_code,
    secondaryName: payload.secondary_name,
    confidence: payload.confidence,
    stage: payload.stage,
    durationMs: payload.duration_ms,
    fromCache: payload.from_cache,
    needsUserConfirmation: payload.needs_user_confirmation,
    message: payload.message,
    aiCalled: payload.ai_called,
  };
}
