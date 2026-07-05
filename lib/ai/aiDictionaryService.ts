import { buildAiDictionaryPrompt } from "@/lib/dictionary/aiDictionaryPrompt";
import {
  parseAiDictionaryEntryWithDetails,
  type AiDictionaryEntryParseResult,
} from "@/lib/ai/parseAiDictionaryEntry";
import { getAiConfigDiagnostic } from "@/lib/ai/config";
import { requestOpenAiChatCompletion } from "@/lib/ai/openAiClient";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";
import { getAiConfig } from "./config";

export type AiDictionaryGenerationResult =
  | { ok: true; entry: DictionaryEntry; attempts: number }
  | {
      ok: false;
      reason: "not_configured" | "network" | "api_error" | "invalid_json";
      attempts: number;
      detail?: string;
    };

function logAiDiagnostic(message: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[ai-dictionary]", message);
}

async function requestOpenAiJson(
  query: DictionaryQuery,
  options: { isRetry: boolean },
): Promise<string | null> {
  const config = getAiConfig();
  if (!config.isConfigured) {
    const diagnostic = getAiConfigDiagnostic();
    if (diagnostic) logAiDiagnostic(diagnostic);
    return null;
  }

  const { system, user } = buildAiDictionaryPrompt(query, options);

  return requestOpenAiChatCompletion({
    model: config.model,
    temperature: options.isRetry ? 0.1 : 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
}

function parseContent(
  content: string,
  query: DictionaryQuery,
): AiDictionaryEntryParseResult {
  const parsed = parseAiDictionaryEntryWithDetails(content, query);
  if (!parsed.success) {
    logAiDiagnostic(
      `AI output parse failed (${parsed.code})${parsed.detail ? `: ${parsed.detail}` : ""}`,
    );
  }
  return parsed;
}

async function callOpenAiDictionary(
  query: DictionaryQuery,
): Promise<AiDictionaryGenerationResult> {
  const config = getAiConfig();
  if (!config.isConfigured) {
    return { ok: false, reason: "not_configured", attempts: 0 };
  }

  const firstContent = await requestOpenAiJson(query, { isRetry: false });
  if (!firstContent) {
    return { ok: false, reason: "api_error", attempts: 1 };
  }

  const firstParse = parseContent(firstContent, query);
  if (firstParse.success) {
    return { ok: true, entry: firstParse.entry, attempts: 1 };
  }

  logAiDiagnostic("Retrying AI dictionary generation after invalid JSON");
  const retryContent = await requestOpenAiJson(query, { isRetry: true });
  if (!retryContent) {
    return { ok: false, reason: "api_error", attempts: 2 };
  }

  const retryParse = parseContent(retryContent, query);
  if (retryParse.success) {
    return { ok: true, entry: retryParse.entry, attempts: 2 };
  }

  return {
    ok: false,
    reason: "invalid_json",
    attempts: 2,
    detail: retryParse.detail,
  };
}

/**
 * Isolated AI wrapper. Returns null when AI is unavailable or output is invalid.
 */
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
    return { ok: false, reason: "not_configured", attempts: 0 };
  }

  if (config.provider === "openai") {
    return callOpenAiDictionary(query);
  }

  return { ok: false, reason: "not_configured", attempts: 0 };
}

export function isAiDictionaryConfigured(): boolean {
  return getAiConfig().isConfigured;
}
