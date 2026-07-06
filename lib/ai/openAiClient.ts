import { getAiBaseUrl, getAiConfig, getAiTimeoutMs } from "@/lib/ai/config";
import type { OpenAiChatCompletionResult, OpenAiErrorCode } from "@/lib/ai/aiErrors";

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

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function logOpenAiSafe(event: string, details: Record<string, unknown>): void {
  console.info(`[openai] ${event}`, details);
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
  const baseUrl = getAiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
    logOpenAiSafe("request_failed", { errorCode, timeoutMs });
    return { ok: false, errorCode };
  }

  if (!response.ok) {
    logOpenAiSafe("http_error", {
      errorCode: "provider_http_error",
      httpStatus: response.status,
      timeoutMs,
    });
    return {
      ok: false,
      errorCode: "provider_http_error",
      httpStatus: response.status,
    };
  }

  try {
    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      logOpenAiSafe("empty_content", { errorCode: "provider_invalid_json" });
      return { ok: false, errorCode: "provider_invalid_json" };
    }
    return { ok: true, content };
  } catch {
    logOpenAiSafe("response_parse_failed", { errorCode: "provider_invalid_json" });
    return { ok: false, errorCode: "provider_invalid_json" };
  }
}

export async function requestOpenAiChatCompletion(
  body: OpenAiChatRequest,
  options: { timeoutMs?: number } = {},
): Promise<string | null> {
  const result = await requestOpenAiChatCompletionDetailed(body, options);
  return result.ok ? result.content : null;
}
