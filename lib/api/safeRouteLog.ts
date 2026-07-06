/**
 * Safe server-side route logging — never log secrets or full request bodies with keys.
 */
export function logRouteResolution(
  route: string,
  details: {
    normalized_key: string;
    source: string;
    ai_called: boolean;
    error_code?: string;
    context_profile?: string;
    duration_ms?: number;
  },
): void {
  console.info(`[${route}]`, {
    normalized_key: details.normalized_key,
    source: details.source,
    ai_called: details.ai_called,
    ...(details.context_profile ? { context_profile: details.context_profile } : {}),
    ...(details.duration_ms !== undefined ? { duration_ms: details.duration_ms } : {}),
    ...(details.error_code ? { error_code: details.error_code } : {}),
  });
}

export function logDictionaryGenerate(details: {
  lookupKey: string;
  input?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  contextProfile: string;
  selectedSource: string;
  aiConfigured?: boolean;
  aiCalled: boolean;
  aiErrorCode?: string;
  durationMs?: number;
}): void {
  console.info("[dictionary.generate]", {
    route: "dictionary.generate",
    ...(details.input ? { input: details.input } : {}),
    lookupKey: details.lookupKey,
    ...(details.sourceLanguage ? { sourceLanguage: details.sourceLanguage } : {}),
    ...(details.targetLanguage ? { targetLanguage: details.targetLanguage } : {}),
    contextProfile: details.contextProfile,
    selectedSource: details.selectedSource,
    ...(details.aiConfigured !== undefined ? { aiConfigured: details.aiConfigured } : {}),
    aiCalled: details.aiCalled,
    ...(details.durationMs !== undefined ? { durationMs: details.durationMs } : {}),
    ...(details.aiErrorCode ? { aiErrorCode: details.aiErrorCode } : {}),
  });
}
