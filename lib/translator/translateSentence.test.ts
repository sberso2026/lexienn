import { afterEach, describe, expect, it, vi } from "vitest";
import * as aiService from "@/lib/translator/aiTranslationService";
import { translateSentence } from "@/lib/translator/translateSentence";
import {
  AI_NOT_CONFIGURED_MESSAGE,
  translatorRequestSchema,
  translatorResponseSchema,
} from "@/lib/translator/translatorSchemas";

const baseRequest = {
  input_text: "I need water.",
  source_language: "en",
  target_language: "tl",
  user_context: "general" as const,
  translation_mode: "natural" as const,
  ai_translation_enabled: true,
  rule_fallback_enabled: true,
};

describe("translateSentence pipeline", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns phrase_pack for exact curated phrase without AI key", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence(baseRequest);

    expect(result.source).toBe("phrase_pack");
    expect(result.translated_text.length).toBeGreaterThan(0);
    expect(result.translated_text).not.toMatch(/MVP mock/i);
    expect(result.unavailable_reason).toBeUndefined();
    expect(translatorResponseSchema.safeParse(result).success).toBe(true);
  });

  it("returns rule_fallback for simple sentence pattern without AI key", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence({
      ...baseRequest,
      input_text: "I need help finding the nearest clinic.",
    });

    expect(result.source).toBe("rule_fallback");
    expect(result.translated_text.length).toBeGreaterThan(0);
    expect(result.unavailable_reason).toBeUndefined();
  });

  it("returns dictionary for exact dictionary word without AI key", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence({
      ...baseRequest,
      input_text: "help",
    });

    expect(result.source).toBe("dictionary");
    expect(result.translated_text).toContain("tulong");
  });

  it("calls AI fallback when no local source matches and AI is enabled", async () => {
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");

    const aiSpy = vi.spyOn(aiService, "translateSentenceWithAi").mockResolvedValue(
      translatorResponseSchema.parse({
        original_text: "Unknown bespoke sentence.",
        translated_text: "Hindi kilalang pangungusap.",
        source_language: "en",
        target_language: "tl",
        natural_translation: "Hindi kilalang pangungusap.",
        pronunciation_simple: "HIN-dee kee-LA-lang",
        confidence_score: 0.7,
        validation_status: "ai_generated",
        source: "ai",
        reliability_label: "AI translation (review recommended)",
      }),
    );
    vi.spyOn(aiService, "isAiTranslationConfigured").mockReturnValue(true);

    const result = await translateSentence({
      ...baseRequest,
      input_text: "This is a completely unknown bespoke sentence for testing.",
    });

    expect(aiSpy).toHaveBeenCalled();
    expect(result.source).toBe("ai");
    expect(result.translated_text).toBe("Hindi kilalang pangungusap.");
  });

  it("returns one clean unavailable message when AI disabled and no local source", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence({
      ...baseRequest,
      input_text: "This is a completely unknown bespoke sentence for testing.",
      ai_translation_enabled: false,
      rule_fallback_enabled: false,
    });

    expect(result.source).toBe("unavailable");
    expect(result.translated_text).toBe("");
    expect(result.unavailable_reason).toBeTruthy();
    expect(result.usage_note).toBeUndefined();
    expect(result.unavailable_reason).not.toBe(result.translated_text);
  });

  it("returns AI not configured message when AI enabled but provider missing", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence({
      ...baseRequest,
      input_text: "This is a completely unknown bespoke sentence for testing.",
      rule_fallback_enabled: false,
    });

    expect(result.source).toBe("unavailable");
    expect(result.unavailable_reason).toBe(AI_NOT_CONFIGURED_MESSAGE);
  });

  it("does not show fake translation for English-to-English", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    const result = await translateSentence({
      ...baseRequest,
      input_text: "I need water.",
      source_language: "en",
      target_language: "en",
    });

    expect(result.usage_note).toContain("both English");
    expect(result.translated_text).not.toMatch(/tubig|MVP mock/i);
    expect(result.source).toBe("dictionary");
  });

  it("does not crash when AI key is missing", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    await expect(translateSentence(baseRequest)).resolves.toBeDefined();
  });
});

describe("translatorRequestSchema", () => {
  it("rejects invalid API payload", () => {
    const result = translatorRequestSchema.safeParse({
      input_text: "",
      source_language: "en",
      target_language: "tl",
    });
    expect(result.success).toBe(false);
  });
});

describe("TranslatorView UI", () => {
  it("auto-plays voice after translate and keeps slow replay fallback", async () => {
    const { readFileSync } = await import("node:fs");
    const content = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(content).not.toContain("Play Voice");
    expect(content).toContain("autoplayRequestId");
    expect(content).toContain("Repeat slowly");
    expect(content).toContain("autoplayBlocked");
    expect(content).toContain("hasTranslation");
  });
});
