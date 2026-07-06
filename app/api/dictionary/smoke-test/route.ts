import { NextResponse } from "next/server";
import { logDictionaryGenerate } from "@/lib/api/safeRouteLog";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import type { DictionaryQuery } from "@/lib/schemas";

export const runtime = "nodejs";

const SMOKE_TEST_CASES = [
  { input_text: "house", label: "curated_dictionary" },
  { input_text: "tie beam", label: "domain_glossary" },
  { input_text: "acceleration", label: "seed_dictionary" },
  { input_text: "footing", label: "domain_glossary" },
  { input_text: "dead load", label: "domain_glossary" },
  { input_text: "differential settlement", label: "domain_glossary" },
  { input_text: "xyzzyplugh999", label: "ai_or_unavailable" },
] as const;

function isSmokeTestAllowed(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true" ||
    process.env.DICTIONARY_SMOKE_TEST_ENABLED === "true"
  );
}

const smokeQueryBase: Omit<DictionaryQuery, "input_text"> = {
  source_language: "en",
  target_language: "tl",
  user_context: "engineer",
  explanation_level: "professional",
  output_mode: "explain_and_translate",
};

export async function GET() {
  if (!isSmokeTestAllowed()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const results = [];

  for (const testCase of SMOKE_TEST_CASES) {
    const query: DictionaryQuery = {
      ...smokeQueryBase,
      input_text: testCase.input_text,
    };
    const lookupKey = normalizeLookupText(testCase.input_text);
    let aiErrorCode: string | undefined;

    try {
      const result = await generateDictionaryEntry(query);
      const aiCalled = result.source === "ai_generated";
      if (result.source === "unavailable") {
        aiErrorCode = result.diagnostics?.fallback_reason ?? "unavailable";
      }

      logDictionaryGenerate({
        lookupKey,
        contextProfile: query.user_context,
        selectedSource: result.source,
        aiCalled,
        aiErrorCode,
      });

      results.push({
        input: testCase.input_text,
        lookupKey,
        expected: testCase.label,
        selectedSource: result.source,
        aiCalled,
        validation_status: result.entry.validation_status,
        confidence: result.entry.confidence.level,
        target_meaning: result.entry.target_meaning.slice(0, 120),
        aiErrorCode: aiErrorCode ?? null,
      });
    } catch {
      results.push({
        input: testCase.input_text,
        lookupKey,
        expected: testCase.label,
        selectedSource: "error",
        aiCalled: false,
        aiErrorCode: "server_error",
      });
    }
  }

  return NextResponse.json({
    runtime: "server",
    developerMode: process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true",
    smokeTestEnabled: process.env.DICTIONARY_SMOKE_TEST_ENABLED === "true",
    results,
  });
}
