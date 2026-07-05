import { NextResponse } from "next/server";
import { logDictionaryGenerate } from "@/lib/api/safeRouteLog";
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

  try {
    const result = await generateDictionaryEntry(parsed.data);
    const aiCalled = result.source === "ai_generated";
    const aiErrorCode =
      result.source === "unavailable"
        ? mapFallbackReasonToErrorCode(result.diagnostics?.fallback_reason)
        : undefined;

    logDictionaryGenerate({
      lookupKey,
      contextProfile: parsed.data.user_context,
      selectedSource: result.source,
      aiCalled,
      aiErrorCode,
    });

    const validated = dictionaryGenerateResponseSchema.safeParse(result);
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
      contextProfile: parsed.data.user_context,
      selectedSource: "unavailable",
      aiCalled: false,
      aiErrorCode: "server_error",
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
  if (lower.includes("ai_enabled is false")) return "provider_disabled";
  if (lower.includes("not configured") || lower.includes("missing")) {
    return "missing_api_key";
  }
  if (lower.includes("valid json")) return "provider_invalid_json";
  if (lower.includes("timeout")) return "provider_timeout";
  return "unavailable";
}
