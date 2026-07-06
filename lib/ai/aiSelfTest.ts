import {
  getAiConfig,
  getAiPublicStatus,
  getAiTimeoutMs,
} from "@/lib/ai/config";
import type { OpenAiErrorCode } from "@/lib/ai/aiErrors";
import { openAiErrorToSafeMessage } from "@/lib/ai/aiErrors";
import {
  getOpenAiChatCompletionsUrl,
  normalizeOpenAiApiBaseUrl,
} from "@/lib/ai/openAiEndpoint";
import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";
import {
  requestOpenAiChatCompletionDetailed,
  resolveOpenAiChatCompletionsEndpoint,
} from "@/lib/ai/openAiClient";
import { z } from "zod";

const selfTestResponseSchema = z.object({
  ok: z.literal(true),
  word: z.string(),
  definition: z.string(),
});

export type AiSelfTestErrorCode =
  | OpenAiErrorCode
  | "model_error";

export type AiSelfTestResult = {
  ok: boolean;
  provider: string;
  model: string | null;
  modelConfigured: boolean;
  hasApiKey: boolean;
  baseUrlConfigured: boolean;
  endpointStyle: "chat_completions";
  finalEndpoint: string;
  aiCallSucceeded: boolean;
  jsonParsed: boolean;
  errorCode: AiSelfTestErrorCode | null;
  httpStatus?: number;
  providerErrorType?: string;
  providerErrorCode?: string;
  safeMessage?: string;
  configWarning?: string | null;
  rawPreview?: string;
};

export function isAiSelfTestEnabled(): boolean {
  return process.env.AI_SELF_TEST_ENABLED === "true";
}

export function validateAiSelfTestToken(token: string | null): boolean {
  const expected = process.env.AI_SELF_TEST_TOKEN?.trim();
  if (!expected || !token) return false;
  return token === expected;
}

export async function runAiSelfTest(): Promise<AiSelfTestResult> {
  const status = getAiPublicStatus();
  const config = getAiConfig();
  const { configWarning } = normalizeOpenAiApiBaseUrl(process.env.AI_BASE_URL);
  const finalEndpoint = getOpenAiChatCompletionsUrl();

  const base: AiSelfTestResult = {
    ok: false,
    provider: status.provider,
    model: config.modelConfigured ? config.model : null,
    modelConfigured: status.modelConfigured,
    hasApiKey: status.hasApiKey,
    baseUrlConfigured: Boolean(process.env.AI_BASE_URL?.trim()),
    endpointStyle: "chat_completions",
    finalEndpoint,
    aiCallSucceeded: false,
    jsonParsed: false,
    errorCode: null,
    configWarning,
  };

  if (!status.hasApiKey) {
    return {
      ...base,
      errorCode: "missing_api_key",
      safeMessage: openAiErrorToSafeMessage("missing_api_key"),
    };
  }
  if (!status.modelConfigured) {
    return {
      ...base,
      errorCode: "model_error",
      safeMessage: "AI model configuration error",
    };
  }

  const { configWarning: endpointWarning } = resolveOpenAiChatCompletionsEndpoint();

  const result = await requestOpenAiChatCompletionDetailed(
    {
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return strict JSON only. No markdown.",
        },
        {
          role: "user",
          content:
            'Return exactly: {"ok": true, "word": "test", "definition": "A procedure used to check that something works."}',
        },
      ],
    },
    { timeoutMs: Math.min(getAiTimeoutMs(), 15_000) },
  );

  if (!result.ok) {
    return {
      ...base,
      configWarning: endpointWarning ?? configWarning,
      errorCode: result.errorCode,
      httpStatus: result.httpStatus,
      providerErrorType: result.providerErrorType,
      providerErrorCode: result.providerErrorCode,
      safeMessage: openAiErrorToSafeMessage(result.errorCode),
    };
  }

  try {
    const json = extractJsonFromAiText(result.content);
    const parsed = selfTestResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ...base,
        aiCallSucceeded: true,
        jsonParsed: false,
        errorCode: "provider_invalid_json",
        safeMessage: openAiErrorToSafeMessage("provider_invalid_json"),
      };
    }

    return {
      ...base,
      ok: true,
      aiCallSucceeded: true,
      jsonParsed: true,
      errorCode: null,
    };
  } catch {
    return {
      ...base,
      aiCallSucceeded: true,
      jsonParsed: false,
      errorCode: "provider_invalid_json",
      safeMessage: openAiErrorToSafeMessage("provider_invalid_json"),
      rawPreview: result.content.slice(0, 120),
    };
  }
}

/** Safe log line for self-test — never includes secrets. */
export function logAiSelfTestResult(result: AiSelfTestResult): void {
  console.info("[ai.self-test]", {
    ok: result.ok,
    provider: result.provider,
    model: result.model,
    modelConfigured: result.modelConfigured,
    hasApiKey: result.hasApiKey,
    aiCallSucceeded: result.aiCallSucceeded,
    jsonParsed: result.jsonParsed,
    errorCode: result.errorCode,
    httpStatus: result.httpStatus,
    endpointStyle: result.endpointStyle,
    finalEndpoint: result.finalEndpoint,
    baseUrlConfigured: result.baseUrlConfigured,
    ...(result.configWarning ? { configWarning: result.configWarning } : {}),
  });
}
