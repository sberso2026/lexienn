import { getAiConfig, getAiTimeoutMs } from "@/lib/ai/config";
import type { OpenAiChatCompletionResult, OpenAiErrorCode } from "@/lib/ai/aiErrors";
import {
  mapHttpStatusToOpenAiErrorCode,
  openAiErrorToSafeMessage,
} from "@/lib/ai/aiErrors";
import {
  getOpenAiChatCompletionsUrl,
  getOpenAiEndpointPathFromUrl,
  normalizeOpenAiApiBaseUrl,
} from "@/lib/ai/openAiEndpoint";

export type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAiChatRequest = {
  model: string;
  temperature: number;
  response_format?: { type: "json_object" };
  messages: OpenAiChatMessage[];
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type OpenAiErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
  };
};

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function logOpenAiSafe(event: string, details: Record<string, unknown>): void {
  const safe = { ...details };
  for (const key of Object.keys(safe)) {
    const value = safe[key];
    if (typeof value === "string" && /sk-|Bearer|api[_-]?key/i.test(value)) {
      safe[key] = "[redacted]";
    }
  }
  console.info(`[openai] ${event}`, safe);
}

async function parseOpenAiErrorBody(
  response: Response,
): Promise<Pick<OpenAiChatCompletionResult & { ok: false }, "providerErrorType" | "providerErrorCode" | "providerErrorMessage">> {
  try {
    const body = (await response.json()) as OpenAiErrorBody;
    const err = body.error;
    if (!err) return {};
    return {
      providerErrorType: err.type,
      providerErrorCode: typeof err.code === "string" ? err.code : undefined,
      providerErrorMessage: err.message?.slice(0, 240),
    };
  } catch {
    return {};
  }
}

export function resolveOpenAiChatCompletionsEndpoint(): {
  url: string;
  endpointPath: string;
  configWarning: string | null;
} {
  const { configWarning } = normalizeOpenAiApiBaseUrl(process.env.AI_BASE_URL);
  const url = getOpenAiChatCompletionsUrl();
  return {
    url,
    endpointPath: getOpenAiEndpointPathFromUrl(url),
    configWarning,
  };
}

export async function requestOpenAiChatCompletionDetailed(
  body: OpenAiChatRequest,
  options: { timeoutMs?: number } = {},
): Promise<OpenAiChatCompletionResult> {
  const config = getAiConfig();
  if (!config.apiKey.length) {
    return { ok: false, errorCode: "missing_api_key" };
  }
  if (!config.modelConfigured) {
    return { ok: false, errorCode: "unknown_provider_error" };
  }

  const timeoutMs = options.timeoutMs ?? getAiTimeoutMs();
  const { url, endpointPath, configWarning } = resolveOpenAiChatCompletionsEndpoint();

  if (configWarning) {
    logOpenAiSafe("config_warning", { message: configWarning, endpointPath });
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: createTimeoutSignal(timeoutMs),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "network_error";
    const errorCode: OpenAiErrorCode =
      name === "TimeoutError" || name === "AbortError"
        ? "provider_timeout"
        : "unknown_provider_error";
    logOpenAiSafe("request_failed", { errorCode, timeoutMs, endpointPath });
    return { ok: false, errorCode, endpointPath };
  }

  if (!response.ok) {
    const providerDetails = await parseOpenAiErrorBody(response);
    const errorCode = mapHttpStatusToOpenAiErrorCode(response.status);
    logOpenAiSafe("http_error", {
      errorCode,
      httpStatus: response.status,
      endpointPath,
      providerErrorType: providerDetails.providerErrorType,
      providerErrorCode: providerDetails.providerErrorCode,
      safeMessage: openAiErrorToSafeMessage(errorCode),
      ...(providerDetails.providerErrorMessage
        ? { providerErrorMessage: providerDetails.providerErrorMessage }
        : {}),
    });
    return {
      ok: false,
      errorCode,
      httpStatus: response.status,
      endpointPath,
      ...providerDetails,
    };
  }

  try {
    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      logOpenAiSafe("empty_content", { errorCode: "provider_invalid_json", endpointPath });
      return { ok: false, errorCode: "provider_invalid_json", endpointPath };
    }
    return { ok: true, content };
  } catch {
    logOpenAiSafe("response_parse_failed", {
      errorCode: "provider_invalid_json",
      endpointPath,
    });
    return { ok: false, errorCode: "provider_invalid_json", endpointPath };
  }
}

export async function requestOpenAiChatCompletion(
  body: OpenAiChatRequest,
  options: { timeoutMs?: number } = {},
): Promise<string | null> {
  const result = await requestOpenAiChatCompletionDetailed(body, options);
  return result.ok ? result.content : null;
}
