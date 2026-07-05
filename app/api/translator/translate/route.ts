import { NextResponse } from "next/server";
import { logRouteResolution } from "@/lib/api/safeRouteLog";
import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import { translateSentence } from "@/lib/translator/translateSentence";
import {
  translatorRequestSchema,
  translatorResponseSchema,
} from "@/lib/translator/translatorSchemas";

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

  const parsed = translatorRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid translation request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await translateSentence(parsed.data);
    const aiCalled = result.source === "ai";
    logRouteResolution("api/translator/translate", {
      normalized_key: normalizeLookupText(parsed.data.input_text),
      source: result.source,
      ai_called: aiCalled,
      ...(result.source === "unavailable"
        ? { error_code: result.unavailable_reason ?? "unavailable" }
        : {}),
    });
    const validated = translatorResponseSchema.safeParse(result);
    if (!validated.success) {
      if (process.env.NODE_ENV === "development") {
        console.error("[translator] invalid response", validated.error.flatten());
      }
      return NextResponse.json(
        { error: "Translation produced an invalid response." },
        { status: 500 },
      );
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    logRouteResolution("api/translator/translate", {
      normalized_key: normalizeLookupText(parsed.data.input_text),
      source: "unavailable",
      ai_called: false,
      error_code: "server_error",
    });
    if (process.env.NODE_ENV === "development") {
      console.error("[translator]", error);
    }
    return NextResponse.json(
      {
        error: "Translation failed.",
        details:
          process.env.NODE_ENV === "development"
            ? [{ path: "server", message }]
            : undefined,
      },
      { status: 500 },
    );
  }
}
