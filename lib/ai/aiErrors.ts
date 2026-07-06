export type OpenAiErrorCode =
  | "missing_api_key"
  | "provider_timeout"
  | "provider_http_error"
  | "provider_invalid_json"
  | "unknown_provider_error";

export type OpenAiChatCompletionResult =
  | { ok: true; content: string }
  | { ok: false; errorCode: OpenAiErrorCode; httpStatus?: number };

export type AiDictionaryFailureReason =
  | "not_configured"
  | "missing_api_key"
  | "provider_timeout"
  | "provider_http_error"
  | "provider_invalid_json"
  | "model_error"
  | "unknown_provider_error";

export function mapOpenAiErrorToAiFailure(
  code: OpenAiErrorCode,
): AiDictionaryFailureReason {
  switch (code) {
    case "missing_api_key":
      return "missing_api_key";
    case "provider_timeout":
      return "provider_timeout";
    case "provider_http_error":
      return "provider_http_error";
    case "provider_invalid_json":
      return "provider_invalid_json";
    default:
      return "unknown_provider_error";
  }
}

export function aiFailureToFallbackReason(reason: AiDictionaryFailureReason): string {
  switch (reason) {
    case "not_configured":
      return "AI provider is not configured";
    case "missing_api_key":
      return "AI provider or API key is not configured";
    case "provider_timeout":
      return "AI provider request timed out";
    case "provider_http_error":
      return "AI provider HTTP error";
    case "provider_invalid_json":
      return "AI generation did not return valid JSON after retry";
    case "model_error":
      return "AI model configuration error";
    default:
      return "AI generation failed";
  }
}

export function aiFailureToErrorCode(reason: AiDictionaryFailureReason): string {
  return reason;
}
