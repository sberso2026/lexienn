import { buildAiDictionaryPrompt } from "@/lib/dictionary/aiDictionaryPrompt";
import {
  aiFailureToErrorCode,
  aiFailureToFallbackReason,
  mapOpenAiErrorToAiFailure,
  type AiDictionaryFailureReason,
} from "@/lib/ai/aiErrors";
import {
  parseAiDictionaryEntryWithDetails,
  type AiDictionaryEntryParseResult,
} from "@/lib/ai/parseAiDictionaryEntry";
import { getAiConfig } from "@/lib/ai/config";
import {
  requestOpenAiChatCompletionDetailed,
} from "@/lib/ai/openAiClient";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";

export type AiDictionaryGenerationResult =
  | { ok: true; entry: DictionaryEntry; attempts: number }
  | {
      ok: false;
      reason: AiDictionaryFailureReason;
      attempts: number;
      errorCode: string;
      detail?: string;
    };

function logAiDictionarySafe(
  event: string,
  details: Record<string, unknown>,
): void {
  console.info(`[ai-dictionary] ${event}`, details);
}

async function requestOpenAiJson(
  query: DictionaryQuery,
  options: { isRetry: boolean },
) {
  const config = getAiConfig();
  if (!config.isConfigured) {
    return {
      ok: false as const,
      reason: "not_configured" as AiDictionaryFailureReason,
    };
  }

  const { system, user } = buildAiDictionaryPrompt(query, options);
  const result = await requestOpenAiChatCompletionDetailed({
    model: config.model,
    temperature: options.isRetry ? 0.1 : 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: mapOpenAiErrorToAiFailure(result.errorCode),
      httpStatus: result.httpStatus,
    };
  }

  return { ok: true as const, content: result.content };
}

function parseContent(
  content: string,
  query: DictionaryQuery,
): AiDictionaryEntryParseResult {
  const parsed = parseAiDictionaryEntryWithDetails(content, query);
  if (!parsed.success) {
    logAiDictionarySafe("parse_failed", {
      code: parsed.code,
      lookupKey: query.input_text.trim().toLowerCase(),
    });
  }
  return parsed;
}

async function callOpenAiDictionary(
  query: DictionaryQuery,
): Promise<AiDictionaryGenerationResult> {
  const config = getAiConfig();
  if (!config.enabled) {
    return {
      ok: false,
      reason: "not_configured",
      attempts: 0,
      errorCode: aiFailureToErrorCode("not_configured"),
    };
  }
  if (!config.providerConfigured) {
    return {
      ok: false,
      reason: "missing_api_key",
      attempts: 0,
      errorCode: aiFailureToErrorCode("missing_api_key"),
    };
  }
  if (!config.modelConfigured) {
    return {
      ok: false,
      reason: "model_error",
      attempts: 0,
      errorCode: aiFailureToErrorCode("model_error"),
    };
  }

  const first = await requestOpenAiJson(query, { isRetry: false });
  if (!first.ok) {
    logAiDictionarySafe("call_failed", {
      attempt: 1,
      reason: first.reason,
      lookupKey: query.input_text.trim().toLowerCase(),
    });
    return {
      ok: false,
      reason: first.reason,
      attempts: 1,
      errorCode: aiFailureToErrorCode(first.reason),
    };
  }

  const firstParse = parseContent(first.content, query);
  if (firstParse.success) {
    logAiDictionarySafe("success", {
      attempts: 1,
      lookupKey: query.input_text.trim().toLowerCase(),
    });
    return { ok: true, entry: firstParse.entry, attempts: 1 };
  }

  logAiDictionarySafe("retry_after_invalid_json", {
    lookupKey: query.input_text.trim().toLowerCase(),
  });
  const retry = await requestOpenAiJson(query, { isRetry: true });
  if (!retry.ok) {
    return {
      ok: false,
      reason: retry.reason,
      attempts: 2,
      errorCode: aiFailureToErrorCode(retry.reason),
    };
  }

  const retryParse = parseContent(retry.content, query);
  if (retryParse.success) {
    logAiDictionarySafe("success", {
      attempts: 2,
      lookupKey: query.input_text.trim().toLowerCase(),
    });
    return { ok: true, entry: retryParse.entry, attempts: 2 };
  }

  return {
    ok: false,
    reason: "provider_invalid_json",
    attempts: 2,
    errorCode: aiFailureToErrorCode("provider_invalid_json"),
    detail: retryParse.detail,
  };
}

export async function generateDictionaryEntryWithAi(
  query: DictionaryQuery,
): Promise<DictionaryEntry | null> {
  const result = await generateDictionaryEntryWithAiDetailed(query);
  return result.ok ? result.entry : null;
}

export async function generateDictionaryEntryWithAiDetailed(
  query: DictionaryQuery,
): Promise<AiDictionaryGenerationResult> {
  const config = getAiConfig();
  if (!config.isConfigured) {
    const reason: AiDictionaryFailureReason = !config.enabled
      ? "not_configured"
      : !config.providerConfigured
        ? "missing_api_key"
        : "model_error";
    return {
      ok: false,
      reason,
      attempts: 0,
      errorCode: aiFailureToErrorCode(reason),
    };
  }

  if (config.provider === "openai") {
    return callOpenAiDictionary(query);
  }

  return {
    ok: false,
    reason: "unknown_provider_error",
    attempts: 0,
    errorCode: aiFailureToErrorCode("unknown_provider_error"),
  };
}

export function isAiDictionaryConfigured(): boolean {
  return getAiConfig().isConfigured;
}

export { aiFailureToFallbackReason, aiFailureToErrorCode };
