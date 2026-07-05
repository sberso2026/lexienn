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
  },
): void {
  console.info(`[${route}]`, {
    normalized_key: details.normalized_key,
    source: details.source,
    ai_called: details.ai_called,
    ...(details.context_profile ? { context_profile: details.context_profile } : {}),
    ...(details.error_code ? { error_code: details.error_code } : {}),
  });
}

export function logDictionaryGenerate(details: {
  lookupKey: string;
  contextProfile: string;
  selectedSource: string;
  aiCalled: boolean;
  aiErrorCode?: string;
}): void {
  console.info("[dictionary.generate]", {
    lookupKey: details.lookupKey,
    contextProfile: details.contextProfile,
    selectedSource: details.selectedSource,
    aiCalled: details.aiCalled,
    ...(details.aiErrorCode ? { aiErrorCode: details.aiErrorCode } : {}),
  });
}
