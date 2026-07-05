import { afterEach, describe, expect, it, vi } from "vitest";
import * as aiService from "@/lib/ai/aiDictionaryService";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { resolveGlossaryEntry } from "@/lib/dictionary/engineeringGlossary";
import { normalizeGlossaryLookupCandidates } from "@/lib/text/normalizeLookupText";

const tieBeamQuery = {
  input_text: "tie beam",
  source_language: "en",
  target_language: "tl",
  user_context: "engineer" as const,
  explanation_level: "professional" as const,
  output_mode: "explain_and_translate" as const,
};

describe("batch 38 engineering glossary fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("tie beam resolves from domain_glossary without AI", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry(tieBeamQuery);

    expect(result.source).toBe("domain_glossary");
    expect(result.entry.confidence.level).toBe("high");
    expect(result.entry.validation_status).toBe("curated");
    expect(result.entry.target_meaning).toMatch(/tie beam|biga na pangtali/i);
    expect(result.entry.general_meaning_en).toMatch(/horizontal structural member/i);
    expect(result.entry.examples.some((ex) => ex.text.includes("Ikinokonekta"))).toBe(
      true,
    );
  });

  it("domain glossary wins when AI throws timeout", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi
      .spyOn(aiService, "generateDictionaryEntryWithAi")
      .mockResolvedValue(null);
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);

    const result = await generateDictionaryEntry(tieBeamQuery);

    expect(aiSpy).not.toHaveBeenCalled();
    expect(result.source).toBe("domain_glossary");
    expect(result.entry.target_meaning).toMatch(/tie beam|biga na pangtali/i);
  });

  it("unknown term uses AI when configured", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue({
      id: "ai-entry",
      input_text: "xyzzyplugh999",
      source_language: "en",
      target_language: "tl",
      entry_type: "word" as const,
      general_meaning_en: "Test meaning",
      detailed_meaning_en: "Test detailed",
      target_meaning: "test target",
      profession_meanings: [],
      examples: [],
      pronunciation: { simple: "test" },
      usage_notes: [],
      related_terms: [],
      common_mistakes: [],
      confidence: { score: 0.7, level: "medium" as const },
      validation_status: "ai_generated_unverified" as const,
      audio_type: "synthetic_tts" as const,
      is_mock_data: false,
    });
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);

    const result = await generateDictionaryEntry({
      ...tieBeamQuery,
      input_text: "xyzzyplugh999",
    });

    expect(aiSpy).toHaveBeenCalled();
    expect(result.source).toBe("ai_generated");
  });

  it("unknown term returns safe unavailable when AI disabled", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry({
      ...tieBeamQuery,
      input_text: "xyzzyplugh999",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.entry.general_meaning_en).not.toMatch(/timed out|invalid JSON/i);
  });

  it("normalizes tie beam punctuation and casing variants", () => {
    for (const input of ["Tie Beam", "tie beam.", " tie   beam "]) {
      const entry = resolveGlossaryEntry({ ...tieBeamQuery, input_text: input });
      expect(entry).not.toBeNull();
      expect(entry?.target_meaning).toMatch(/tie beam|biga na pangtali/i);
    }
  });

  it("normalizes plural tie beams to tie beam", () => {
    const candidates = normalizeGlossaryLookupCandidates("tie beams");
    expect(candidates).toContain("tie beam");
  });
});
