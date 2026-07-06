export type OpenAiErrorCode =
  | "missing_api_key"
  | "provider_timeout"
  | "provider_bad_request"
  | "provider_auth_error"
  | "provider_permission_error"
  | "provider_model_or_endpoint_not_found"
  | "provider_rate_or_quota_error"
  | "provider_server_error"
  | "provider_http_error"
  | "provider_invalid_json"
  | "unknown_provider_error";

export type OpenAiProviderErrorDetails = {
  httpStatus: number;
  providerErrorType?: string;
  providerErrorCode?: string;
  providerErrorMessage?: string;
  endpointPath: string;
};

export type OpenAiChatCompletionResult =
  | { ok: true; content: string }
  | ({ ok: false; errorCode: OpenAiErrorCode } & Partial<OpenAiProviderErrorDetails>);

export type AiDictionaryFailureReason =
  | "not_configured"
  | "missing_api_key"
  | "provider_timeout"
  | "provider_bad_request"
  | "provider_auth_error"
  | "provider_permission_error"
  | "provider_model_or_endpoint_not_found"
  | "provider_rate_or_quota_error"
  | "provider_server_error"
  | "provider_http_error"
  | "provider_invalid_json"
  | "model_error"
  | "unknown_provider_error";

export function mapHttpStatusToOpenAiErrorCode(status: number): OpenAiErrorCode {
  if (status === 400) return "provider_bad_request";
  if (status === 401) return "provider_auth_error";
  if (status === 403) return "provider_permission_error";
  if (status === 404) return "provider_model_or_endpoint_not_found";
  if (status === 429) return "provider_rate_or_quota_error";
  if (status >= 500) return "provider_server_error";
  return "provider_http_error";
}

export function mapOpenAiErrorToAiFailure(
  code: OpenAiErrorCode,
): AiDictionaryFailureReason {
  switch (code) {
    case "missing_api_key":
      return "missing_api_key";
    case "provider_timeout":
      return "provider_timeout";
    case "provider_bad_request":
      return "provider_bad_request";
    case "provider_auth_error":
      return "provider_auth_error";
    case "provider_permission_error":
      return "provider_permission_error";
    case "provider_model_or_endpoint_not_found":
      return "provider_model_or_endpoint_not_found";
    case "provider_rate_or_quota_error":
      return "provider_rate_or_quota_error";
    case "provider_server_error":
      return "provider_server_error";
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
    case "provider_bad_request":
      return "AI provider rejected the request";
    case "provider_auth_error":
      return "AI provider authentication failed";
    case "provider_permission_error":
      return "AI provider permission denied";
    case "provider_model_or_endpoint_not_found":
      return "AI model or endpoint not found — check AI_MODEL and AI_BASE_URL";
    case "provider_rate_or_quota_error":
      return "AI provider rate limit or quota exceeded";
    case "provider_server_error":
      return "AI provider server error";
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

export function openAiErrorToSafeMessage(code: OpenAiErrorCode): string {
  return aiFailureToFallbackReason(mapOpenAiErrorToAiFailure(code));
}
