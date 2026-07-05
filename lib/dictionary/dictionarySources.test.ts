import { afterEach, describe, expect, it, vi } from "vitest";

import * as aiService from "@/lib/ai/aiDictionaryService";

import { getAiStatus } from "@/lib/ai/config";

import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";

import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";



const generalQuery: DictionaryQuery = {

  input_text: "prodigy",

  source_language: "en",

  target_language: "tl",

  user_context: "general",

  explanation_level: "normal",

  output_mode: "explain_and_translate",

};



const engineerDeepBeamQuery: DictionaryQuery = {

  input_text: "deep beam",

  source_language: "en",

  target_language: "tl",

  user_context: "engineer",

  explanation_level: "professional",

  output_mode: "explain_and_translate",

};



const engineerDeadLoadQuery: DictionaryQuery = {

  input_text: "dead load",

  source_language: "en",

  target_language: "tl",

  user_context: "engineer",

  explanation_level: "professional",

  output_mode: "explain_and_translate",

};



const englishToEnglishQuery: DictionaryQuery = {

  input_text: "prodigy",

  source_language: "en",

  target_language: "en",

  user_context: "general",

  explanation_level: "normal",

  output_mode: "explain",

};



function stubAiDisabled(): void {

  vi.stubEnv("AI_ENABLED", "false");

  vi.stubEnv("AI_API_KEY", "");

  vi.stubEnv("AI_PROVIDER", "");

  vi.stubEnv("AI_MODEL", "");

}



function stubAiEnabled(): void {

  vi.stubEnv("AI_ENABLED", "true");

  vi.stubEnv("AI_API_KEY", "test-key");

  vi.stubEnv("AI_PROVIDER", "openai");

  vi.stubEnv("AI_MODEL", "gpt-4o-mini");

}



const mockAiEntry: DictionaryEntry = {

  id: "entry-ai-test",

  input_text: "serendipity",

  source_language: "en",

  target_language: "tl",

  target_dialect: undefined,

  entry_type: "word",

  general_meaning_en: "The occurrence of pleasant surprises by chance.",

  detailed_meaning_en:

    "Serendipity describes finding something good without looking for it.",

  target_meaning: "magkataon na mahanap ang maganda",

  profession_meanings: [],

  examples: [

    { text: "It was pure serendipity.", language_code: "en", context_label: "General" },

  ],

  pronunciation: { simple: "ser-en-DIP-i-tee" },

  usage_notes: [],

  related_terms: ["luck", "chance"],

  common_mistakes: [],

  confidence: { score: 0.82, level: "high" },

  validation_status: "ai_generated",

  audio_type: "synthetic_tts",

  is_mock_data: false,

};



describe("dictionarySources resolution", () => {

  afterEach(() => {

    vi.unstubAllEnvs();

    vi.restoreAllMocks();

  });



  it("returns curated_dictionary for curate with a real definition", async () => {

    stubAiDisabled();



    const result = await generateDictionaryEntry({

      ...generalQuery,

      input_text: "curate",

    });



    expect(result.source).toBe("curated_dictionary");

    expect(result.entry.general_meaning_en).toMatch(/select|organize|present/i);

    expect(result.entry.general_meaning_en).not.toMatch(/Unavailable|MVP mock/i);

  });



  it("returns curated_dictionary for prodigy with a real general definition", async () => {

    stubAiDisabled();



    const result = await generateDictionaryEntry(generalQuery);



    expect(result.source).toBe("curated_dictionary");

    expect(result.entry.general_meaning_en).toContain("exceptional talent");

    expect(result.entry.general_meaning_en).not.toMatch(/MVP mock/i);

    expect(result.entry.is_mock_data).toBe(false);

  });



  it("returns domain_glossary for deep beam with engineer context", async () => {

    stubAiDisabled();



    const result = await generateDictionaryEntry(engineerDeepBeamQuery);



    expect(result.source).toBe("domain_glossary");

    expect(result.entry.detailed_meaning_en).toContain("span-to-depth ratio");

    expect(result.entry.detailed_meaning_en).toContain("compression strut");

    const engineerMeaning = result.entry.profession_meanings.find(

      (meaning) => meaning.context === "engineer",

    );

    expect(engineerMeaning?.meaning_en).toContain("span-to-depth ratio");

    expect(engineerMeaning?.caution_note).toContain(

      "not professional design advice",

    );

  });



  it("returns domain_glossary for dead load with engineer context", async () => {

    stubAiDisabled();



    const result = await generateDictionaryEntry(engineerDeadLoadQuery);



    expect(result.source).toBe("domain_glossary");

    expect(result.entry.detailed_meaning_en).toMatch(/permanent|self-weight|dead load/i);

    expect(result.entry.detailed_meaning_en).not.toMatch(/Unavailable/i);

  });



  it("does not show fake translation for English-to-English queries", async () => {

    stubAiDisabled();



    const result = await generateDictionaryEntry(englishToEnglishQuery);



    expect(result.source).toBe("curated_dictionary");

    expect(result.entry.target_meaning).toBe(result.entry.detailed_meaning_en);

    expect(result.entry.target_meaning).not.toMatch(/MVP mock|\[MVP/i);

  });



  it("returns unavailable for unknown nonsense input without AI configured", async () => {
    stubAiDisabled();
    vi.stubEnv("NODE_ENV", "development");

    const result = await generateDictionaryEntry({
      ...generalQuery,
      input_text: "xyzzyplugh999",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.entry.general_meaning_en).not.toMatch(/MVP mock/i);
    expect(result.diagnostics).toBeUndefined();
  });

  it("returns ai_generated for unknown normal words when AI is configured", async () => {
    stubAiEnabled();
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue({
      ...mockAiEntry,
      input_text: "serendipity",
      validation_status: "ai_generated_unverified",
    });

    const result = await generateDictionaryEntry({
      ...generalQuery,
      input_text: "serendipity",
    });

    expect(result.source).toBe("ai_generated");
    expect(result.entry.general_meaning_en).toContain("pleasant surprises");
    expect(result.diagnostics).toBeUndefined();
  });

  it("falls back to unavailable when AI JSON is invalid", async () => {
    stubAiEnabled();
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue(null);

    const result = await generateDictionaryEntry({
      ...generalQuery,
      input_text: "xyzzyplugh999",
    });

    expect(result.source).toBe("unavailable");
    expect(result.entry.general_meaning_en).toContain("not available yet");
    expect(result.diagnostics).toBeUndefined();
  });



  it("reports AI config status without exposing secrets", () => {

    stubAiEnabled();

    const status = getAiStatus();

    expect(status).toEqual({

      ai_enabled: true,

      provider: "openai",

      provider_configured: true,

      model_configured: true,

      fallback_enabled: true,

    });

    expect(JSON.stringify(status)).not.toContain("test-key");

  });

});

