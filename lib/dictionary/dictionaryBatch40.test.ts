import { afterEach, describe, expect, it, vi } from "vitest";
import * as aiService from "@/lib/ai/aiDictionaryService";
import { buildDictionaryQueryFromSearchParams } from "@/lib/dictionary/buildDictionaryQueryFromParams";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { mapAiDictionaryResultToEntry } from "@/lib/ai/mapAiDictionaryResult";
import { aiDictionaryResultSchema } from "@/lib/ai/aiDictionaryResultSchema";
import type { DictionaryQuery } from "@/lib/schemas";

const validAiJson = {
  word: "palimpsest",
  sourceLanguage: "en",
  targetLanguage: "en",
  partOfSpeech: "noun",
  generalMeaning:
    "A manuscript or document written on a surface that has been reused after earlier writing was erased.",
  detailedMeaning:
    "Historically, palimpsests were created when parchment was scarce. The term is also used metaphorically for layered histories or hidden traces.",
  definitionSummary:
    "A reused writing surface or something with layers of meaning beneath the visible text.",
  sampleSentences: [
    "Scholars used imaging to read the palimpsest beneath the later text.",
  ],
  pronunciationText: "PAL-im-sest",
  usageNotes: [],
  relatedTerms: ["manuscript", "parchment", "archaeology"],
  commonMistakes: [],
  confidenceScore: 0.7,
  confidenceLabel: "medium" as const,
  validationStatus: "ai_generated_unverified" as const,
};

function stubAiDisabled(): void {
  vi.stubEnv("AI_ENABLED", "false");
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_MODEL", "");
}

function stubAiEnabled(): void {
  vi.stubEnv("AI_ENABLED", "true");
  vi.stubEnv("AI_API_KEY", "test-key");
  vi.stubEnv("AI_PROVIDER", "openai");
  vi.stubEnv("AI_MODEL", "gpt-4o-mini");
}

describe("batch 40 dictionary generation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("English-to-English seed dictionary returns acceleration without AI", async () => {
    stubAiDisabled();

    const result = await generateDictionaryEntry({
      input_text: "acceleration",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(result.source).toBe("seed_dictionary");
    expect(result.entry.general_meaning_en).toMatch(/rate at which velocity changes/i);
    expect(result.entry.target_meaning).toBe(result.entry.detailed_meaning_en);
    expect(result.entry.general_meaning_en).not.toMatch(/not available yet/i);
  });

  it("English-to-Filipino seed dictionary returns acceleration with translation", async () => {
    stubAiDisabled();

    const result = await generateDictionaryEntry({
      input_text: "acceleration",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    });

    expect(result.source).toBe("seed_dictionary");
    expect(result.entry.general_meaning_en).toMatch(/rate at which velocity changes/i);
    expect(result.entry.target_meaning).toMatch(/pagbilis/i);
  });

  it("unknown real word palimpsest uses AI when mock succeeds", async () => {
    stubAiEnabled();
    vi.stubEnv("NODE_ENV", "development");
    const query: DictionaryQuery = {
      input_text: "palimpsest",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    };
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAiDetailed").mockResolvedValue({
      ok: true,
      entry: mapAiDictionaryResultToEntry(aiDictionaryResultSchema.parse(validAiJson), query),
      attempts: 1,
    });

    const result = await generateDictionaryEntry(query);

    expect(result.source).toBe("ai_generated");
    expect(result.entry.general_meaning_en).toMatch(/manuscript|document/i);
  });

  it("AI failure returns safe unavailable with error code only in Developer Mode", async () => {
    stubAiEnabled();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAiDetailed").mockResolvedValue({
      ok: false,
      reason: "provider_timeout",
      attempts: 1,
      errorCode: "provider_timeout",
    });

    const result = await generateDictionaryEntry({
      input_text: "palimpsest",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.diagnostics.used_ai).toBe(true);
    expect(result.diagnostics.aiErrorCode).toBe("provider_timeout");
  });

  it("buildDictionaryQueryFromSearchParams preserves target=en from URL", () => {
    const params = new URLSearchParams({
      input: "acceleration",
      target: "en",
      context: "general",
    });

    const query = buildDictionaryQueryFromSearchParams(params, {
      default_source_language: "en",
      default_target_language: "tl",
      default_user_context: "general",
      default_explanation_level: "normal",
    });

    expect(query).not.toBeNull();
    expect(query?.input_text).toBe("acceleration");
    expect(query?.target_language).toBe("en");
    expect(query?.source_language).toBe("en");
  });

  it("acceleration does not call AI when seed_dictionary has it", async () => {
    stubAiEnabled();
    const aiSpy = vi.spyOn(aiService, "generateDictionaryEntryWithAiDetailed");

    const result = await generateDictionaryEntry({
      input_text: "acceleration",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(result.source).toBe("seed_dictionary");
    expect(aiSpy).not.toHaveBeenCalled();
  });

  it("normalizes fil target alias to tl", () => {
    const params = new URLSearchParams({
      input: "acceleration",
      target: "fil",
      context: "general",
    });

    const query = buildDictionaryQueryFromSearchParams(params);
    expect(query?.target_language).toBe("tl");
  });
});
