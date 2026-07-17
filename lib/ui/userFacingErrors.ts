/** Map internal/API error text to calm copy for normal users. */

const INTERNAL_PATTERNS =
  /valid json|invalid json|schema|provider|timeout|timed out|diagnostic|fallback_reason|mvp|mock data|route failed|ai_api|openai|anthropic/i;

export const USER_LOOKUP_UNAVAILABLE =
  "Lookup is temporarily unavailable. Please try again.";

export const USER_TRANSLATION_UNAVAILABLE =
  "Translation is temporarily unavailable. Try again or use an offline pack.";

export const USER_GENERIC_RETRY = "Something went wrong. Please try again.";

export const USER_OCR_UNAVAILABLE =
  "Couldn’t read the image. Try again or type the text.";

export function toUserFacingError(
  message: string | null | undefined,
  fallback: string = USER_GENERIC_RETRY,
): string {
  if (!message?.trim()) return fallback;
  if (INTERNAL_PATTERNS.test(message)) return fallback;
  return message.trim();
}
