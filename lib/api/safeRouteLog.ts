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
  },
): void {
  console.info(`[${route}]`, {
    normalized_key: details.normalized_key,
    source: details.source,
    ai_called: details.ai_called,
    ...(details.error_code ? { error_code: details.error_code } : {}),
  });
}
