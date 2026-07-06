import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getAiSelfTest } from "@/app/api/ai/self-test/route";
import { GET as getAiStatus } from "@/app/api/ai/status/route";
import * as aiService from "@/lib/ai/aiDictionaryService";
import * as openAiClient from "@/lib/ai/openAiClient";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";

const baseQuery = {
  source_language: "en",
  target_language: "tl",
  user_context: "general" as const,
  explanation_level: "normal" as const,
  output_mode: "explain_and_translate" as const,
};

describe("batch 39 AI dictionary generation path", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("unknown word microcracking uses AI when mock returns valid JSON", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    vi.spyOn(openAiClient, "requestOpenAiChatCompletionDetailed").mockResolvedValue({
      ok: true,
      content: JSON.stringify({
        word: "microcrackingzzz",
        sourceLanguage: "en",
        targetLanguage: "tl",
        partOfSpeech: "word",
        generalMeaning: "Very small cracks in a material.",
        detailedMeaning: "Microcracking can indicate early damage.",
        definitionSummary: "maliliit na bitak",
        sampleSentences: ["Microcracking was observed."],
        pronunciationText: "MY-kroh-kraking",
        usageNotes: [],
        relatedTerms: [],
        commonMistakes: [],
        confidenceScore: 0.7,
        confidenceLabel: "medium",
        validationStatus: "ai_generated_unverified",
      }),
    });
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);

    const result = await generateDictionaryEntry({
      ...baseQuery,
      input_text: "microcrackingzzz",
    });

    expect(result.source).toBe("ai_generated");
    expect(result.entry.target_meaning).toContain("bitak");
  });

  it("microcracking resolves from domain glossary without AI", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");

    const aiSpy = vi.spyOn(aiService, "generateDictionaryEntryWithAiDetailed");

    const result = await generateDictionaryEntry({
      ...baseQuery,
      input_text: "microcracking",
      user_context: "engineer",
      explanation_level: "professional",
    });

    expect(aiSpy).not.toHaveBeenCalled();
    expect(result.source).toBe("domain_glossary");
    expect(result.entry.target_meaning).toMatch(/microcracking|maliliit na bitak/i);
  });

  it("unknown word returns safe unavailable when AI times out", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");

    vi.spyOn(openAiClient, "requestOpenAiChatCompletionDetailed").mockResolvedValue({
      ok: false,
      errorCode: "provider_timeout",
    });
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);

    const result = await generateDictionaryEntry({
      ...baseQuery,
      input_text: "microcrackingzzz",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.entry.general_meaning_en).not.toMatch(/timed out|invalid JSON/i);
    expect(result.diagnostics).toBeUndefined();
  });

  it("house and tie beam do not call AI", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");

    const aiSpy = vi
      .spyOn(aiService, "generateDictionaryEntryWithAiDetailed")
      .mockResolvedValue({
        ok: false,
        reason: "provider_timeout",
        attempts: 1,
        errorCode: "provider_timeout",
      });
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);

    const house = await generateDictionaryEntry({
      ...baseQuery,
      input_text: "house",
    });
    expect(house.source).toBe("curated_dictionary");
    expect(aiSpy).not.toHaveBeenCalled();

    aiSpy.mockClear();
    const tieBeam = await generateDictionaryEntry({
      ...baseQuery,
      input_text: "tie beam",
      user_context: "engineer",
      explanation_level: "professional",
    });
    expect(tieBeam.source).toBe("domain_glossary");
    expect(aiSpy).not.toHaveBeenCalled();
  });

  it("AI status includes camelCase safe diagnostics", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_TIMEOUT_MS", "30000");

    const response = await getAiStatus();
    const body = await response.json();

    expect(body.aiEnabled).toBe(true);
    expect(body.hasApiKey).toBe(true);
    expect(body.timeoutMs).toBe(30000);
    expect(body.runtime).toBe("server");
    expect(body.ai_enabled).toBe(true);
  });

  it("AI self-test disabled returns 404", async () => {
    vi.stubEnv("AI_SELF_TEST_ENABLED", "false");
    const response = await getAiSelfTest(
      new Request("http://localhost/api/ai/self-test?token=secret"),
    );
    expect(response.status).toBe(404);
  });

  it("AI self-test wrong token returns 403", async () => {
    vi.stubEnv("AI_SELF_TEST_ENABLED", "true");
    vi.stubEnv("AI_SELF_TEST_TOKEN", "correct-token");
    const response = await getAiSelfTest(
      new Request("http://localhost/api/ai/self-test?token=wrong"),
    );
    expect(response.status).toBe(403);
  });

  it("AI self-test success with correct token", async () => {
    vi.stubEnv("AI_SELF_TEST_ENABLED", "true");
    vi.stubEnv("AI_SELF_TEST_TOKEN", "correct-token");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    vi.spyOn(openAiClient, "requestOpenAiChatCompletionDetailed").mockResolvedValue({
      ok: true,
      content: JSON.stringify({
        ok: true,
        word: "test",
        definition: "A procedure used to check that something works.",
      }),
    });

    const response = await getAiSelfTest(
      new Request("http://localhost/api/ai/self-test?token=correct-token"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.aiCallSucceeded).toBe(true);
    expect(body.jsonParsed).toBe(true);
    expect(body.errorCode).toBeNull();
  });

  it("extractJsonFromAiText parses fenced JSON", () => {
    const parsed = extractJsonFromAiText(
      'Here is the result:\n```json\n{"word":"test","definitionSummary":"ok"}\n```',
    ) as Record<string, string>;
    expect(parsed.word).toBe("test");
  });
});
