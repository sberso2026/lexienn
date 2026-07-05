import { afterEach, describe, expect, it, vi } from "vitest";
import * as aiService from "@/lib/ai/aiDictionaryService";
import { parseAiDictionaryEntryWithDetails } from "@/lib/ai/parseAiDictionaryEntry";
import { mapAiDictionaryResultToEntry } from "@/lib/ai/mapAiDictionaryResult";
import { aiDictionaryResultSchema } from "@/lib/ai/aiDictionaryResultSchema";
import { shouldShowInternalDebugUi } from "@/lib/debug/shouldShowInternalDebugUi";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { buildUnavailableEntry } from "@/lib/dictionary/normalizeDictionaryEntry";
import { DICTIONARY_SOURCE_LABELS } from "@/lib/dictionary/dictionarySources";
import type { DictionaryQuery } from "@/lib/schemas";

const query: DictionaryQuery = {
  input_text: "serendipity",
  source_language: "en",
  target_language: "tl",
  user_context: "general",
  explanation_level: "normal",
  output_mode: "explain_and_translate",
};

const validAiJson = {
  word: "serendipity",
  sourceLanguage: "en",
  targetLanguage: "tl",
  partOfSpeech: "noun",
  generalMeaning: "A pleasant surprise found by chance.",
  detailedMeaning:
    "Serendipity describes discovering something valuable or delightful without looking for it.",
  definitionSummary: "magkataong pagkakatuklas",
  sampleSentences: ["It was pure serendipity."],
  pronunciationText: "ser-en-DIP-i-tee",
  usageNotes: ["Formal and literary register."],
  relatedTerms: ["luck", "chance"],
  commonMistakes: ["Confusing with coincidence in all contexts."],
  confidenceScore: 0.68,
  confidenceLabel: "medium",
  validationStatus: "ai_generated_unverified",
} as const;

describe("DictionaryAIGeneration-1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("parses valid strict AI JSON into a dictionary entry", () => {
    const parsed = parseAiDictionaryEntryWithDetails(JSON.stringify(validAiJson), query);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.entry.general_meaning_en).toContain("pleasant surprise");
    expect(parsed.entry.validation_status).toBe("ai_generated_unverified");
    expect(parsed.entry.confidence.score).toBeGreaterThanOrEqual(0.6);
  });

  it("maps AiDictionaryResult fields to DictionaryEntry", () => {
    const aiResult = aiDictionaryResultSchema.parse(validAiJson);
    const entry = mapAiDictionaryResultToEntry(aiResult, query);
    expect(entry.input_text).toBe("serendipity");
    expect(entry.examples.length).toBeGreaterThan(0);
    expect(entry.pronunciation.simple).toBe("ser-en-DIP-i-tee");
  });

  it("returns curated dictionary before AI for known words", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi.spyOn(aiService, "generateDictionaryEntryWithAi");

    const result = await generateDictionaryEntry({
      ...query,
      input_text: "curate",
    });

    expect(result.source).toBe("curated_dictionary");
    expect(aiSpy).not.toHaveBeenCalled();
  });

  it("falls back to AI generation for unknown words when AI is configured", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue(
      mapAiDictionaryResultToEntry(aiDictionaryResultSchema.parse(validAiJson), query),
    );

    const result = await generateDictionaryEntry(query);

    expect(result.source).toBe("ai_generated");
    expect(result.entry.general_meaning_en).toContain("pleasant surprise");
    expect(result.entry.validation_status).toBe("ai_generated_unverified");
  });

  it("retries once when the first AI response is invalid JSON", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not valid json {{{" } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validAiJson) } }],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await aiService.generateDictionaryEntryWithAiDetailed(query);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempts).toBe(2);
      expect(result.entry.validation_status).toBe("ai_generated_unverified");
    }
  });

  it("shows one clean unavailable message after AI retry failure", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue(null);

    const result = await generateDictionaryEntry(query);

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.entry.general_meaning_en).not.toMatch(/timed out|invalid JSON/i);
    expect(result.entry.general_meaning_en).toBe(result.entry.detailed_meaning_en);
    expect(result.diagnostics).toBeUndefined();
  });

  it("hides development diagnostics unless developer mode feature is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "");
    expect(shouldShowInternalDebugUi()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "true");
    expect(shouldShowInternalDebugUi()).toBe(false);
  });

  it("labels AI-generated source as AI-generated, unverified", () => {
    expect(DICTIONARY_SOURCE_LABELS.ai_generated).toBe("AI-generated, unverified");
  });

  it("buildUnavailableEntry keeps a single user-facing message in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const entry = buildUnavailableEntry(
      query,
      "AI generation did not return valid JSON after retry",
    );
    expect(entry.general_meaning_en).toBe(entry.detailed_meaning_en);
    expect(entry.general_meaning_en).not.toMatch(/\(AI generation/);
  });
});
