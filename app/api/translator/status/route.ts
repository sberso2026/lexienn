import { NextResponse } from "next/server";
import { isAiTranslationConfigured } from "@/lib/translator/aiTranslationService";
import { translatorProviderStatusSchema } from "@/lib/translator/translatorSchemas";

export async function GET() {
  const status = translatorProviderStatusSchema.parse({
    ai_configured: isAiTranslationConfigured(),
    ai_translation_enabled: true,
    rule_fallback_enabled: true,
  });

  return NextResponse.json(status);
}
