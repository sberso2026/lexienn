import { afterEach, describe, expect, it, vi } from "vitest";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import * as aiDictionaryService from "@/lib/ai/aiDictionaryService";
import * as aiTranslationService from "@/lib/translator/aiTranslationService";
import { translateSentence } from "@/lib/translator/translateSentence";

const translatorBase = {
  source_language: "en",
  target_language: "tl",
  user_context: "general" as const,
  translation_mode: "natural" as const,
  ai_translation_enabled: true,
  rule_fallback_enabled: true,
};

describe("batch 37 curated fallback before AI", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("translator resolves What's your name? to curated phrase without AI", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await translateSentence({
      ...translatorBase,
      input_text: "What's your name?",
    });

    expect(result.translated_text).toBe("Ano ang pangalan mo?");
    expect(result.source).toBe("curated_phrase");
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.8);
    expect(result.validation_status).toBe("curated");
    expect(result.unavailable_reason).toBeUndefined();
  });

  it("dictionary resolves house to bahay without AI", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry({
      input_text: "house",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    });

    expect(result.source).toBe("curated_dictionary");
    expect(result.entry.target_meaning).toContain("bahay");
    expect(result.entry.validation_status).toBe("curated");
    expect(result.entry.confidence.level).toBe("high");
    expect(result.entry.examples.some((ex) => ex.text.includes("bahay"))).toBe(true);
  });

  it("translator resolves name question variants to same curated phrase", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    for (const input of [
      "What's your name?",
      "what's your name?",
      "whats your name",
      "What is your name?",
    ]) {
      const result = await translateSentence({
        ...translatorBase,
        input_text: input,
      });
      expect(result.translated_text).toBe("Ano ang pangalan mo?");
      expect(result.source).toBe("curated_phrase");
    }
  });

  it("curated translator result survives simulated AI timeout", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key-not-real");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi
      .spyOn(aiTranslationService, "translateSentenceWithAi")
      .mockResolvedValue(null);
    vi.spyOn(aiTranslationService, "isAiTranslationConfigured").mockReturnValue(true);

    const result = await translateSentence({
      ...translatorBase,
      input_text: "What's your name?",
    });

    expect(aiSpy).not.toHaveBeenCalled();
    expect(result.source).toBe("curated_phrase");
    expect(result.translated_text).toBe("Ano ang pangalan mo?");
    expect(result.unavailable_reason).toBeUndefined();
  });

  it("curated dictionary result survives simulated AI failure", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key-not-real");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi
      .spyOn(aiDictionaryService, "generateDictionaryEntryWithAi")
      .mockResolvedValue(null);
    vi.spyOn(aiDictionaryService, "isAiDictionaryConfigured").mockReturnValue(true);

    const result = await generateDictionaryEntry({
      input_text: "house",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    });

    expect(aiSpy).not.toHaveBeenCalled();
    expect(result.source).toBe("curated_dictionary");
    expect(result.entry.target_meaning).toContain("bahay");
  });

  it("unavailable dictionary uses user-safe message", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry({
      input_text: "xyzzyplugh999",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.entry.general_meaning_en).not.toMatch(/timed out|invalid JSON/i);
  });

  it("unavailable translator uses user-safe message without AI timeout wording", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");

    vi.spyOn(aiTranslationService, "translateSentenceWithAi").mockResolvedValue(null);
    vi.spyOn(aiTranslationService, "isAiTranslationConfigured").mockReturnValue(true);

    const result = await translateSentence({
      ...translatorBase,
      input_text: "completely unknown bespoke phrase xyz999",
      rule_fallback_enabled: false,
    });

    expect(result.source).toBe("unavailable");
    expect(result.unavailable_reason).toContain("not available yet");
    expect(result.unavailable_reason).not.toMatch(/timed out|invalid JSON/i);
  });
});
