import { NextResponse } from "next/server";
import { logRouteResolution } from "@/lib/api/safeRouteLog";
import { dictionaryGenerateResponseSchema } from "@/lib/dictionary/apiSchemas";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import { dictionaryQuerySchema } from "@/lib/schemas";

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

  try {
    const result = await generateDictionaryEntry(parsed.data);
    const aiCalled = result.source === "ai_generated";
    logRouteResolution("api/dictionary/generate", {
      normalized_key: normalizeLookupText(parsed.data.input_text),
      source: result.source,
      ai_called: aiCalled,
      ...(result.source === "unavailable"
        ? { error_code: result.diagnostics?.fallback_reason ?? "unavailable" }
        : {}),
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
    logRouteResolution("api/dictionary/generate", {
      normalized_key: normalizeLookupText(parsed.data.input_text),
      source: "unavailable",
      ai_called: false,
      error_code: "server_error",
    });
    return NextResponse.json(
      { error: "Dictionary generation failed." },
      { status: 500 },
    );
  }
}
