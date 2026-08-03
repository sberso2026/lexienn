import { NextResponse } from "next/server";
import { z } from "zod";
import { detectLanguagePipeline } from "@/lib/languages/languageDetectionPipeline";
import { logRouteResolution } from "@/lib/api/safeRouteLog";

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
  provider_language: z.string().nullable().optional(),
  provider_confidence: z.number().min(0).max(1).nullable().optional(),
  allow_ai: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid language detection request." }, { status: 400 });
  }

  try {
    const result = await detectLanguagePipeline(parsed.data.text, {
      allowAi: parsed.data.allow_ai !== false,
      providerLanguage: parsed.data.provider_language,
      providerConfidence: parsed.data.provider_confidence,
    });

    logRouteResolution("api/language/detect", {
      normalized_key: parsed.data.text.slice(0, 40),
      source: result.stage,
      ai_called: result.aiCalled,
    });

    return NextResponse.json({
      primary_code: result.primaryCode,
      primary_name: result.primaryName,
      secondary_code: result.secondaryCode,
      secondary_name: result.secondaryName,
      confidence: result.confidence,
      stage: result.stage,
      duration_ms: result.durationMs,
      from_cache: result.fromCache,
      needs_user_confirmation: result.needsUserConfirmation,
      message: result.message,
      ai_called: result.aiCalled,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[language/detect]", error);
    }
    return NextResponse.json({ error: "Language detection failed." }, { status: 500 });
  }
}
