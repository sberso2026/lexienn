import { NextResponse } from "next/server";
import { logDictionaryGenerate } from "@/lib/api/safeRouteLog";
import { aiFailureToErrorCode } from "@/lib/ai/aiErrors";
import { isAiDictionaryConfigured } from "@/lib/ai/aiDictionaryService";
import { isServerDeveloperDiagnosticsEnabled } from "@/lib/debug/serverDiagnostics";
import { dictionaryGenerateResponseSchema } from "@/lib/dictionary/apiSchemas";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import { dictionaryQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = dictionaryQuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid dictionary request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const lookupKey = normalizeLookupText(parsed.data.input_text);
  const startedAt = Date.now();

  try {
    const result = await generateDictionaryEntry(parsed.data);
    const durationMs = Date.now() - startedAt;
    const aiCalled = result.diagnostics.used_ai;
    const aiErrorCode =
      result.source === "unavailable"
        ? mapFallbackReasonToErrorCode(result.diagnostics.fallback_reason)
        : undefined;

    logDictionaryGenerate({
      lookupKey,
      input: parsed.data.input_text,
      sourceLanguage: parsed.data.source_language,
      targetLanguage: parsed.data.target_language,
      contextProfile: parsed.data.user_context,
      selectedSource: result.source,
      aiConfigured: isAiDictionaryConfigured(),
      aiCalled,
      aiErrorCode,
      durationMs,
    });

    const clientPayload = {
      query: result.query,
      entry: result.entry,
      source: result.source,
      ...(isServerDeveloperDiagnosticsEnabled()
        ? { diagnostics: result.diagnostics }
        : {}),
    };

    const validated = dictionaryGenerateResponseSchema.safeParse(clientPayload);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dictionary generation produced an invalid response." },
        { status: 500 },
      );
    }
    return NextResponse.json(validated.data);
  } catch {
    logDictionaryGenerate({
      lookupKey,
      input: parsed.data.input_text,
      sourceLanguage: parsed.data.source_language,
      targetLanguage: parsed.data.target_language,
      contextProfile: parsed.data.user_context,
      selectedSource: "unavailable",
      aiConfigured: isAiDictionaryConfigured(),
      aiCalled: false,
      aiErrorCode: "server_error",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "Dictionary generation failed." },
      { status: 500 },
    );
  }
}

function mapFallbackReasonToErrorCode(reason?: string): string {
  if (!reason) return "unavailable";
  const lower = reason.toLowerCase();
  if (lower.includes("provider_disabled") || lower.includes("ai_enabled is false")) {
    return "provider_disabled";
  }
  if (lower.includes("missing_api_key") || lower.includes("api key is not configured")) {
    return "missing_api_key";
  }
  if (lower.includes("provider_invalid_json") || lower.includes("valid json")) {
    return "provider_invalid_json";
  }
  if (lower.includes("provider_timeout") || lower.includes("timed out")) {
    return "provider_timeout";
  }
  if (lower.includes("provider_model_or_endpoint_not_found") || lower.includes("model or endpoint not found")) {
    return "provider_model_or_endpoint_not_found";
  }
  if (lower.includes("provider_auth_error") || lower.includes("authentication failed")) {
    return "provider_auth_error";
  }
  if (lower.includes("provider_rate_or_quota") || lower.includes("rate limit") || lower.includes("quota")) {
    return "provider_rate_or_quota_error";
  }
  if (lower.includes("provider_http_error") || lower.includes("http error")) {
    return "provider_http_error";
  }
  if (lower.includes("model_error") || lower.includes("ai_model")) {
    return "model_error";
  }
  const codeMatch = reason.match(/\(([\w_]+)\)\s*$/);
  if (codeMatch?.[1]) return codeMatch[1];
  return aiFailureToErrorCode("unknown_provider_error");
}
