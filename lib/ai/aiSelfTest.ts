import {
  getAiConfig,
  getAiPublicStatus,
  getAiTimeoutMs,
} from "@/lib/ai/config";
import type { OpenAiErrorCode } from "@/lib/ai/aiErrors";
import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";
import { requestOpenAiChatCompletionDetailed } from "@/lib/ai/openAiClient";
import { z } from "zod";

const selfTestResponseSchema = z.object({
  ok: z.literal(true),
  word: z.string(),
  definition: z.string(),
});

export type AiSelfTestResult = {
  ok: boolean;
  provider: string;
  modelConfigured: boolean;
  hasApiKey: boolean;
  aiCallSucceeded: boolean;
  jsonParsed: boolean;
  errorCode:
    | "provider_timeout"
    | "provider_http_error"
    | "provider_invalid_json"
    | "missing_api_key"
    | "model_error"
    | "unknown_provider_error"
    | null;
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
  const base: AiSelfTestResult = {
    ok: false,
    provider: status.provider,
    modelConfigured: status.modelConfigured,
    hasApiKey: status.hasApiKey,
    aiCallSucceeded: false,
    jsonParsed: false,
    errorCode: null,
  };

  if (!status.hasApiKey) {
    return { ...base, errorCode: "missing_api_key" };
  }
  if (!status.modelConfigured) {
    return { ...base, errorCode: "model_error" };
  }

  const config = getAiConfig();
  const result = await requestOpenAiChatCompletionDetailed(
    {
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON only with keys ok (true), word ("test"), definition (short English definition). No markdown.',
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
      errorCode: mapOpenAiToSelfTestError(result.errorCode),
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
      rawPreview: result.content.slice(0, 120),
    };
  }
}

function mapOpenAiToSelfTestError(
  code: OpenAiErrorCode,
): AiSelfTestResult["errorCode"] {
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

/** Safe log line for self-test — never includes secrets. */
export function logAiSelfTestResult(result: AiSelfTestResult): void {
  console.info("[ai.self-test]", {
    ok: result.ok,
    provider: result.provider,
    modelConfigured: result.modelConfigured,
    hasApiKey: result.hasApiKey,
    aiCallSucceeded: result.aiCallSucceeded,
    jsonParsed: result.jsonParsed,
    errorCode: result.errorCode,
    baseUrlConfigured: Boolean(process.env.AI_BASE_URL?.trim()),
  });
}
